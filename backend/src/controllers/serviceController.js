const { query } = require('../config/db');
const { cacheGet, cacheSet } = require('../config/redis');

// GET /api/services/search?q=mri&city=Ahmedabad
async function searchServices(req, res, next) {
  try {
    const { q = '', city, category, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const cacheKey = `search:${q}:${city}:${category}:${page}:${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const params = [];
    const conditions = [];
    let p = 1;

    if (q.trim()) {
      conditions.push(`(s.name ILIKE $${p} OR sc.name ILIKE $${p})`);
      params.push(`%${q.trim()}%`);
      p++;
    }

    if (category) {
      conditions.push(`sc.slug = $${p}`);
      params.push(category);
      p++;
    }

    if (city) {
      conditions.push(`h.city ILIKE $${p}`);
      params.push(`%${city}%`);
      p++;
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const { rows } = await query(
      `SELECT DISTINCT ON (s.id)
         s.id, s.name, s.description, s.report_time,
         sc.name AS category, sc.slug AS category_slug, sc.icon AS category_icon,
         MIN(hs.price) OVER (PARTITION BY s.id) / 100.0 AS lowest_price,
         MAX(hs.price) OVER (PARTITION BY s.id) / 100.0 AS highest_price,
         COUNT(hs.hospital_id) OVER (PARTITION BY s.id) AS hospital_count,
         COUNT(*) OVER() AS total_count
       FROM services s
       JOIN service_categories sc ON sc.id = s.category_id
       JOIN hospital_services hs ON hs.service_id = s.id AND hs.is_available = TRUE
       JOIN hospitals h ON h.id = hs.hospital_id AND h.is_active = TRUE
       ${where}
       ORDER BY s.id, hs.price ASC
       LIMIT $${p} OFFSET $${p + 1}`,
      [...params, parseInt(limit), offset]
    );

    const result = {
      services: rows.map(({ total_count, ...s }) => s),
      total: parseInt(rows[0]?.total_count || 0),
    };

    await cacheSet(cacheKey, result, 120);
    res.json(result);
  } catch (err) {
    next(err);
  }
}

// GET /api/services/categories
async function getCategories(req, res, next) {
  try {
    const cacheKey = 'service:categories';
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const { rows } = await query(
      `SELECT sc.*, COUNT(s.id) AS service_count,
              MIN(hs.price) / 100.0 AS min_price
       FROM service_categories sc
       LEFT JOIN services s ON s.category_id = sc.id
       LEFT JOIN hospital_services hs ON hs.service_id = s.id AND hs.is_available = TRUE
       GROUP BY sc.id
       ORDER BY sc.name`
    );

    await cacheSet(cacheKey, rows, 600);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/services/trending?city=Ahmedabad
async function getTrending(req, res, next) {
  try {
    const { city = 'Ahmedabad', limit = 6 } = req.query;
    const cacheKey = `trending:${city}:${limit}`;
    const cached = await cacheGet(cacheKey);
    if (cached) return res.json(cached);

    const { rows } = await query(
      `SELECT
         s.id, s.name, sc.name AS category, sc.icon AS category_icon,
         COUNT(b.id) AS booking_count,
         MIN(hs.price) / 100.0 AS lowest_price,
         COUNT(DISTINCT hs.hospital_id) AS hospital_count,
         ROUND(AVG(hs.wait_time_min)) AS avg_wait_min
       FROM services s
       JOIN service_categories sc ON sc.id = s.category_id
       JOIN hospital_services hs ON hs.service_id = s.id AND hs.is_available = TRUE
       JOIN hospitals h ON h.id = hs.hospital_id AND h.is_active = TRUE AND LOWER(h.city) = LOWER($1)
       LEFT JOIN bookings b ON b.service_id = s.id AND b.created_at > NOW() - INTERVAL '30 days'
       GROUP BY s.id, sc.name, sc.icon
       ORDER BY booking_count DESC, hospital_count DESC
       LIMIT $2`,
      [city, parseInt(limit)]
    );

    await cacheSet(cacheKey, rows, 300);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// GET /api/services/autocomplete?q=mri
async function autocomplete(req, res, next) {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) return res.json([]);

    const { rows } = await query(
      `SELECT DISTINCT s.name, sc.name AS category
       FROM services s
       JOIN service_categories sc ON sc.id = s.category_id
       WHERE s.name ILIKE $1
       ORDER BY s.name LIMIT 8`,
      [`${q}%`]
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

module.exports = { searchServices, getCategories, getTrending, autocomplete };
