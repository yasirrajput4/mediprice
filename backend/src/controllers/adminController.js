const { query, getClient } = require('../config/db');
const { cacheDelPattern } = require('../config/redis');

// GET /api/admin/dashboard/:hospitalId
async function getDashboard(req, res, next) {
  try {
    const { hospitalId } = req.params;

    const [statsRes, recentBookingsRes, topServicesRes] = await Promise.all([
      query(
        `SELECT
           COUNT(*) FILTER (WHERE b.status = 'confirmed' AND b.slot_date = CURRENT_DATE) AS bookings_today,
           COUNT(*) FILTER (WHERE b.status = 'confirmed' AND b.slot_date >= DATE_TRUNC('month', NOW())) AS bookings_month,
           COALESCE(SUM(b.total_amount) FILTER (WHERE p.status = 'paid' AND b.slot_date >= DATE_TRUNC('month', NOW())), 0) / 100.0 AS revenue_month,
           COALESCE(AVG(r.rating), 0)::DECIMAL(3,2) AS avg_rating,
           COUNT(r.id) AS total_reviews,
           COALESCE(AVG(hs.wait_time_min), 0)::INTEGER AS avg_wait
         FROM bookings b
         JOIN hospitals h ON h.id = b.hospital_id
         LEFT JOIN payments p ON p.booking_id = b.id
         LEFT JOIN reviews r ON r.hospital_id = b.hospital_id
         LEFT JOIN hospital_services hs ON hs.hospital_id = b.hospital_id
         WHERE b.hospital_id = $1`,
        [hospitalId]
      ),
      query(
        `SELECT
           b.uuid, b.patient_name, b.slot_date, b.slot_time, b.status,
           b.total_amount / 100.0 AS total_amount,
           s.name AS service_name
         FROM bookings b
         JOIN services s ON s.id = b.service_id
         WHERE b.hospital_id = $1
         ORDER BY b.created_at DESC LIMIT 10`,
        [hospitalId]
      ),
      query(
        `SELECT
           s.name AS service_name,
           COUNT(b.id) AS booking_count,
           COALESCE(SUM(b.total_amount) / 100.0, 0) AS revenue,
           hs.price / 100.0 AS price,
           hs.wait_time_min
         FROM hospital_services hs
         JOIN services s ON s.id = hs.service_id
         LEFT JOIN bookings b ON b.service_id = hs.service_id AND b.hospital_id = hs.hospital_id
           AND b.status = 'confirmed'
         WHERE hs.hospital_id = $1 AND hs.is_available = TRUE
         GROUP BY s.name, hs.price, hs.wait_time_min
         ORDER BY booking_count DESC LIMIT 5`,
        [hospitalId]
      ),
    ]);

    res.json({
      stats: statsRes.rows[0],
      recentBookings: recentBookingsRes.rows,
      topServices: topServicesRes.rows,
    });
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/:hospitalId/services
async function listServices(req, res, next) {
  try {
    const { hospitalId } = req.params;
    const { rows } = await query(
      `SELECT
         hs.id, hs.price / 100.0 AS price,
         hs.discounted_price / 100.0 AS discounted_price,
         hs.wait_time_min, hs.is_available, hs.last_updated,
         s.id AS service_id, s.name, s.description,
         sc.name AS category, sc.icon AS category_icon
       FROM hospital_services hs
       JOIN services s ON s.id = hs.service_id
       JOIN service_categories sc ON sc.id = s.category_id
       WHERE hs.hospital_id = $1
       ORDER BY sc.name, s.name`,
      [hospitalId]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// PUT /api/admin/:hospitalId/services/:serviceId
async function updateService(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { hospitalId, serviceId } = req.params;
    const { price, discountedPrice, waitTimeMin, isAvailable } = req.body;

    // Get current price for history
    const { rows: current } = await client.query(
      `SELECT id, price FROM hospital_services WHERE hospital_id = $1 AND service_id = $2`,
      [hospitalId, serviceId]
    );
    if (!current.length) return res.status(404).json({ error: 'Service not found for this hospital' });

    const newPrice = price !== undefined ? Math.round(parseFloat(price) * 100) : current[0].price;

    // Record price history if price changed
    if (price !== undefined && newPrice !== current[0].price) {
      await client.query(
        `INSERT INTO price_history (hospital_service_id, old_price, new_price, changed_by)
         VALUES ($1, $2, $3, $4)`,
        [current[0].id, current[0].price, newPrice, req.user.id]
      );
    }

    const { rows } = await client.query(
      `UPDATE hospital_services SET
         price = $1,
         discounted_price = $2,
         wait_time_min = COALESCE($3, wait_time_min),
         is_available = COALESCE($4, is_available),
         last_updated = NOW(),
         updated_by = $5
       WHERE hospital_id = $6 AND service_id = $7
       RETURNING *, price / 100.0 AS price_inr`,
      [
        newPrice,
        discountedPrice !== undefined ? Math.round(parseFloat(discountedPrice) * 100) : null,
        waitTimeMin || null,
        isAvailable !== undefined ? isAvailable : null,
        req.user.id,
        hospitalId,
        serviceId,
      ]
    );

    await client.query('COMMIT');
    await cacheDelPattern(`hospital:${hospitalId}*`);

    // Refresh stats async
    query('REFRESH MATERIALIZED VIEW CONCURRENTLY hospital_stats').catch(() => {});

    res.json(rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// POST /api/admin/:hospitalId/services — add service
async function addService(req, res, next) {
  try {
    const { hospitalId } = req.params;
    const { serviceId, price, waitTimeMin } = req.body;

    if (!serviceId || !price) return res.status(400).json({ error: 'serviceId and price required' });

    const { rows } = await query(
      `INSERT INTO hospital_services (hospital_id, service_id, price, wait_time_min)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [hospitalId, serviceId, Math.round(parseFloat(price) * 100), waitTimeMin || 20]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

// GET /api/admin/:hospitalId/bookings
async function listBookings(req, res, next) {
  try {
    const { hospitalId } = req.params;
    const { date, status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const params = [hospitalId];
    let p = 2;
    const conditions = ['b.hospital_id = $1'];

    if (date) { conditions.push(`b.slot_date = $${p}`); params.push(date); p++; }
    if (status) { conditions.push(`b.status = $${p}`); params.push(status); p++; }

    const where = conditions.join(' AND ');
    const { rows } = await query(
      `SELECT
         b.uuid, b.patient_name, b.patient_phone, b.slot_date, b.slot_time,
         b.status, b.total_amount / 100.0 AS total_amount, b.notes,
         s.name AS service_name,
         p.status AS payment_status, p.method AS payment_method,
         COUNT(*) OVER() AS total_count
       FROM bookings b
       JOIN services s ON s.id = b.service_id
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE ${where}
       ORDER BY b.slot_date DESC, b.slot_time
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, parseInt(limit), offset]
    );

    const total = rows[0]?.total_count || 0;
    res.json({
      bookings: rows.map(({ total_count, ...b }) => b),
      pagination: { page: parseInt(page), limit: parseInt(limit), total: parseInt(total) },
    });
  } catch (err) {
    next(err);
  }
}

// PATCH /api/admin/:hospitalId/bookings/:bookingId/status
async function updateBookingStatus(req, res, next) {
  try {
    const { hospitalId, bookingId } = req.params;
    const { status } = req.body;

    const validStatuses = ['confirmed', 'completed', 'cancelled', 'no_show'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const { rows } = await query(
      `UPDATE bookings SET status = $1
       WHERE uuid = $2 AND hospital_id = $3
       RETURNING uuid, status, patient_name`,
      [status, bookingId, hospitalId]
    );
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });

    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  getDashboard,
  listServices,
  updateService,
  addService,
  listBookings,
  updateBookingStatus,
};
