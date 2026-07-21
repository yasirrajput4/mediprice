const { query } = require("../config/db");
const { cacheGet, cacheSet } = require("../config/redis");

// GET /api/hospitals — with filters, sorting, pagination
async function listHospitals(req, res, next) {
  try {
    const {
      city = "Ahmedabad",
      lat,
      lng,
      radius = 20, // km
      sort = "distance", // distance | price | rating | wait
      minRating,
      maxPrice,
      minPrice,
      maxWait,
      category,
      service_id,
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build dynamic query
    const conditions = ["h.is_active = TRUE"];
    const params = [];
    let p = 1;

    // Location filter
    let distanceExpr = "NULL";
    if (lat && lng) {
      distanceExpr = `(
        6371 * acos(
          cos(radians($${p})) * cos(radians(h.lat)) *
          cos(radians(h.lng) - radians($${p + 1})) +
          sin(radians($${p})) * sin(radians(h.lat))
        )
      )`;
      conditions.push(`${distanceExpr} <= $${p + 2}`);
      params.push(parseFloat(lat), parseFloat(lng), parseFloat(radius));
      p += 3;
    } else {
      conditions.push(`LOWER(h.city) = LOWER($${p})`);
      params.push(city);
      p++;
    }

    if (minRating) {
      conditions.push(`hs_stats.avg_rating >= $${p}`);
      params.push(parseFloat(minRating));
      p++;
    }

    if (service_id) {
      conditions.push(`EXISTS (
        SELECT 1 FROM hospital_services hsv
        WHERE hsv.hospital_id = h.id
          AND hsv.service_id = $${p}
          AND hsv.is_available = TRUE
      )`);
      params.push(parseInt(service_id));
      p++;

      if (maxPrice) {
        conditions.push(`(
          SELECT price FROM hospital_services hsv2
          WHERE hsv2.hospital_id = h.id AND hsv2.service_id = $${p - 1}
        ) <= $${p}`);
        params.push(parseInt(maxPrice) * 100); // convert ₹ to paise
        p++;
      }

      if (minPrice) {
        conditions.push(`(
          SELECT price FROM hospital_services hsv3
          WHERE hsv3.hospital_id = h.id AND hsv3.service_id = $${p - 2}
        ) >= $${p}`);
        params.push(parseInt(minPrice) * 100);
        p++;
      }

      if (maxWait) {
        conditions.push(`(
          SELECT wait_time_min FROM hospital_services hsv4
          WHERE hsv4.hospital_id = h.id AND hsv4.service_id = $${p - 3}
        ) <= $${p}`);
        params.push(parseInt(maxWait));
        p++;
      }
    }

    const where = conditions.join(" AND ");

    const sortMap = {
      distance:
        lat && lng
          ? `${distanceExpr.replace(/\$\d+/g, (m) => m)} ASC NULLS LAST`
          : "h.name ASC",
      rating: "hs_stats.avg_rating DESC NULLS LAST",
      wait: "hs_stats.avg_wait_min ASC",
      price: service_id
        ? `(SELECT price FROM hospital_services hsp WHERE hsp.hospital_id = h.id AND hsp.service_id = ${parseInt(service_id)}) ASC NULLS LAST`
        : "h.name ASC",
    };

    const orderBy = sortMap[sort] || "h.name ASC";

    const sql = `
      SELECT
        h.id, h.uuid, h.name, h.address, h.city, h.lat, h.lng,
        h.phone, h.logo_url, h.accreditations, h.facilities, h.is_verified,
        COALESCE(hs_stats.avg_rating, 0)::DECIMAL(3,2) AS rating,
        COALESCE(hs_stats.review_count, 0) AS review_count,
        COALESCE(hs_stats.avg_wait_min, 20) AS avg_wait_min,
        COALESCE(hs_stats.fairness_score, 75) AS fairness_score,
        ${lat && lng ? distanceExpr : "NULL"} AS distance_km,
        ${
          service_id
            ? `(
          SELECT hsv.price FROM hospital_services hsv
          WHERE hsv.hospital_id = h.id AND hsv.service_id = ${parseInt(service_id)}
          LIMIT 1
        )`
            : "NULL"
        } AS service_price,
        COUNT(*) OVER() AS total_count
      FROM hospitals h
      LEFT JOIN hospital_stats hs_stats ON hs_stats.hospital_id = h.id
      WHERE ${where}
      ORDER BY ${orderBy}
      LIMIT $${p} OFFSET $${p + 1}
    `;

    params.push(parseInt(limit), offset);
    const { rows } = await query(sql, params);

    const total = rows[0]?.total_count || 0;
    const hospitals = rows.map(({ total_count, ...h }) => ({
      ...h,
      service_price: h.service_price ? h.service_price / 100 : null, // paise → ₹
      distance_km: h.distance_km ? parseFloat(h.distance_km).toFixed(1) : null,
    }));

    res.json({
      hospitals,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(total),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/hospitals/:id
async function getHospital(req, res, next) {
  try {
    const { id } = req.params;
    const cacheKey = `hospital:${id}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const { rows } = await query(
      `SELECT
         h.*,
         COALESCE(hs.avg_rating, 0)::DECIMAL(3,2) AS rating,
         COALESCE(hs.review_count, 0) AS review_count,
         COALESCE(hs.avg_wait_min, 20) AS avg_wait_min,
         COALESCE(hs.fairness_score, 75) AS fairness_score,
         COALESCE(hs.total_bookings, 0) AS total_bookings
       FROM hospitals h
       LEFT JOIN hospital_stats hs ON hs.hospital_id = h.id
       WHERE h.id = $1 AND h.is_active = TRUE`,
      [id],
    );
    if (!rows.length)
      return res.status(404).json({ error: "Hospital not found" });

    await cacheSet(cacheKey, rows[0], 300); // cache 5 min
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/hospitals/:id/services
async function getHospitalServices(req, res, next) {
  try {
    const { id } = req.params;
    const { category } = req.query;

    let sql = `
      SELECT
        hs.id AS hospital_service_id,
        hs.price / 100.0 AS price,
        hs.discounted_price / 100.0 AS discounted_price,
        hs.wait_time_min,
        hs.is_available,
        hs.last_updated,
        s.id AS service_id, s.name, s.description, s.preparation, s.report_time,
        sc.name AS category, sc.slug AS category_slug, sc.icon AS category_icon
      FROM hospital_services hs
      JOIN services s ON s.id = hs.service_id
      JOIN service_categories sc ON sc.id = s.category_id
      WHERE hs.hospital_id = $1 AND hs.is_available = TRUE
    `;
    const params = [id];
    if (category) {
      sql += ` AND sc.slug = $2`;
      params.push(category);
    }
    sql += " ORDER BY sc.name, s.name";

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/hospitals/:id/reviews
async function getHospitalReviews(req, res, next) {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { rows } = await query(
      `SELECT
         r.id, r.rating, r.review_text, r.created_at,
         u.name AS user_name,
         s.name AS service_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       JOIN bookings b ON b.id = r.booking_id
       JOIN services s ON s.id = b.service_id
       WHERE r.hospital_id = $1
       ORDER BY r.created_at DESC
       LIMIT $2 OFFSET $3`,
      [id, parseInt(limit), offset],
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/hospitals/:id/slots — available time slots
async function getHospitalSlots(req, res, next) {
  try {
    const { id } = req.params;
    const { service_id, date } = req.query;
    if (!service_id)
      return res.status(400).json({ error: "service_id required" });

    const targetDate = date || new Date().toISOString().split("T")[0];

    const { rows } = await query(
      `SELECT
         ts.id, ts.slot_date, ts.slot_time,
         ts.capacity - ts.booked AS available_seats,
         ts.booked, ts.capacity
       FROM time_slots ts
       WHERE ts.hospital_id = $1
         AND ts.service_id = $2
         AND ts.slot_date >= $3
         AND ts.slot_date <= $3::DATE + INTERVAL '6 days'
         AND ts.capacity > ts.booked
       ORDER BY ts.slot_date, ts.slot_time`,
      [id, service_id, targetDate],
    );

    // Group by date
    const grouped = rows.reduce((acc, slot) => {
      const d = slot.slot_date.toISOString().split("T")[0];
      if (!acc[d]) acc[d] = [];
      acc[d].push({
        id: slot.id,
        time: slot.slot_time,
        available: slot.available_seats,
      });
      return acc;
    }, {});

    res.json(grouped);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  listHospitals,
  getHospital,
  getHospitalServices,
  getHospitalReviews,
  getHospitalSlots,
};
