const { query, getClient } = require('../config/db');
const { cacheDelPattern } = require('../config/redis');

const PLATFORM_FEE = parseInt(process.env.PLATFORM_FEE || '4900'); // paise

// POST /api/bookings
async function createBooking(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const {
      hospitalId,
      serviceId,
      timeSlotId,
      slotDate,
      slotTime,
      patientName,
      patientPhone,
      patientRelation = 'self',
      notes,
    } = req.body;

    // Validate required fields
    if (!hospitalId || !serviceId || !slotDate || !slotTime || !patientName || !patientPhone) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get service price
    const { rows: priceRows } = await client.query(
      `SELECT price FROM hospital_services
       WHERE hospital_id = $1 AND service_id = $2 AND is_available = TRUE`,
      [hospitalId, serviceId]
    );
    if (!priceRows.length) {
      return res.status(404).json({ error: 'Service not available at this hospital' });
    }
    const servicePrice = priceRows[0].price;

    // Lock the time slot
    if (timeSlotId) {
      const { rows: slotRows } = await client.query(
        `SELECT id, capacity, booked FROM time_slots
         WHERE id = $1 AND hospital_id = $2 AND service_id = $3
         FOR UPDATE`,
        [timeSlotId, hospitalId, serviceId]
      );
      if (!slotRows.length) {
        return res.status(404).json({ error: 'Time slot not found' });
      }
      const slot = slotRows[0];
      if (slot.booked >= slot.capacity) {
        return res.status(409).json({ error: 'Time slot is fully booked' });
      }
      await client.query(
        'UPDATE time_slots SET booked = booked + 1 WHERE id = $1',
        [timeSlotId]
      );
    }

    const totalAmount = servicePrice + PLATFORM_FEE;

    const { rows: bookingRows } = await client.query(
      `INSERT INTO bookings
         (user_id, hospital_id, service_id, time_slot_id, patient_name, patient_phone,
          patient_relation, slot_date, slot_time, service_price, platform_fee, total_amount, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING *`,
      [
        req.user?.id || null,
        hospitalId, serviceId, timeSlotId || null,
        patientName, patientPhone, patientRelation,
        slotDate, slotTime,
        servicePrice, PLATFORM_FEE, totalAmount,
        notes || null,
      ]
    );

    await client.query('COMMIT');

    const booking = bookingRows[0];
    // Convert paise → ₹ for response
    booking.service_price = booking.service_price / 100;
    booking.platform_fee = booking.platform_fee / 100;
    booking.total_amount = booking.total_amount / 100;

    res.status(201).json(booking);
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// GET /api/bookings/:id
async function getBooking(req, res, next) {
  try {
    const { id } = req.params;

    const { rows } = await query(
      `SELECT
         b.*, b.uuid,
         b.service_price / 100.0 AS service_price,
         b.platform_fee / 100.0 AS platform_fee,
         b.total_amount / 100.0 AS total_amount,
         h.name AS hospital_name, h.address AS hospital_address, h.phone AS hospital_phone,
         s.name AS service_name, s.preparation AS service_preparation,
         p.status AS payment_status, p.razorpay_payment_id, p.method AS payment_method
       FROM bookings b
       JOIN hospitals h ON h.id = b.hospital_id
       JOIN services s ON s.id = b.service_id
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE b.uuid = $1`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });

    const booking = rows[0];
    // Only owner or hospital admin can view
    if (req.user && booking.user_id !== req.user.id && req.user.role === 'patient') {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json(booking);
  } catch (err) {
    next(err);
  }
}

// GET /api/bookings (user's own bookings)
async function listUserBookings(req, res, next) {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let sql = `
      SELECT
        b.uuid, b.patient_name, b.slot_date, b.slot_time, b.status,
        b.total_amount / 100.0 AS total_amount,
        h.name AS hospital_name,
        s.name AS service_name,
        p.status AS payment_status
      FROM bookings b
      JOIN hospitals h ON h.id = b.hospital_id
      JOIN services s ON s.id = b.service_id
      LEFT JOIN payments p ON p.booking_id = b.id
      WHERE b.user_id = $1
    `;
    const params = [req.user.id];
    let p = 2;

    if (status) {
      sql += ` AND b.status = $${p}`;
      params.push(status);
      p++;
    }

    sql += ` ORDER BY b.slot_date DESC LIMIT $${p} OFFSET $${p + 1}`;
    params.push(parseInt(limit), offset);

    const { rows } = await query(sql, params);
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

// PATCH /api/bookings/:id/cancel
async function cancelBooking(req, res, next) {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const { rows } = await client.query(
      `SELECT b.*, p.status AS payment_status, p.razorpay_payment_id
       FROM bookings b
       LEFT JOIN payments p ON p.booking_id = b.id
       WHERE b.uuid = $1 FOR UPDATE`,
      [id]
    );
    if (!rows.length) return res.status(404).json({ error: 'Booking not found' });

    const booking = rows[0];
    if (booking.status === 'cancelled') {
      return res.status(400).json({ error: 'Booking is already cancelled' });
    }
    if (booking.status === 'completed') {
      return res.status(400).json({ error: 'Cannot cancel a completed booking' });
    }

    await client.query(
      'UPDATE bookings SET status = $1 WHERE id = $2',
      ['cancelled', booking.id]
    );

    if (booking.time_slot_id) {
      await client.query(
        'UPDATE time_slots SET booked = GREATEST(0, booked - 1) WHERE id = $1',
        [booking.time_slot_id]
      );
    }

    await client.query('COMMIT');

    await cacheDelPattern(`hospital:${booking.hospital_id}*`);
    res.json({ message: 'Booking cancelled successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
}

// POST /api/bookings/:id/review
async function submitReview(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, reviewText } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5' });
    }

    const { rows: bookingRows } = await query(
      `SELECT id, hospital_id, user_id, status FROM bookings WHERE uuid = $1`,
      [id]
    );
    if (!bookingRows.length) return res.status(404).json({ error: 'Booking not found' });

    const booking = bookingRows[0];
    if (booking.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed bookings' });
    }

    const { rows } = await query(
      `INSERT INTO reviews (booking_id, user_id, hospital_id, rating, review_text)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [booking.id, req.user.id, booking.hospital_id, rating, reviewText || null]
    );

    // Refresh materialized view (async)
    query('REFRESH MATERIALIZED VIEW CONCURRENTLY hospital_stats').catch(() => {});
    await cacheDelPattern(`hospital:${booking.hospital_id}*`);

    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
}

module.exports = { createBooking, getBooking, listUserBookings, cancelBooking, submitReview };
