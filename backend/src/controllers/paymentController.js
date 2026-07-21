const Razorpay = require("razorpay");
const crypto = require("crypto");
const { query } = require("../config/db");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// POST /api/payments/order
async function createOrder(req, res, next) {
  try {
    const { bookingId } = req.body;
    if (!bookingId)
      return res.status(400).json({ error: "bookingId required" });

    const { rows } = await query(
      `SELECT b.id, b.uuid, b.total_amount, b.status, h.name AS hospital_name, s.name AS service_name
       FROM bookings b
       JOIN hospitals h ON h.id = b.hospital_id
       JOIN services s ON s.id = b.service_id
       WHERE b.uuid = $1`,
      [bookingId],
    );
    if (!rows.length)
      return res.status(404).json({ error: "Booking not found" });

    const booking = rows[0];
    if (booking.status !== "pending") {
      return res.status(400).json({ error: "Booking is not in pending state" });
    }

    // Check for existing payment
    const { rows: existingPayment } = await query(
      `SELECT razorpay_order_id FROM payments WHERE booking_id = $1 AND status = 'created'`,
      [booking.id],
    );
    if (existingPayment.length && existingPayment[0].razorpay_order_id) {
      return res.json({ orderId: existingPayment[0].razorpay_order_id });
    }

    // Create Razorpay order (amount in paise)
    const order = await razorpay.orders.create({
      amount: booking.total_amount, // already in paise
      currency: "INR",
      receipt: `booking_${booking.uuid}`,
      notes: {
        bookingId: booking.uuid,
        hospitalName: booking.hospital_name,
        serviceName: booking.service_name,
      },
    });

    // Save payment record
    await query(
      `INSERT INTO payments (booking_id, razorpay_order_id, amount, status)
       VALUES ($1, $2, $3, 'created')
       ON CONFLICT (razorpay_order_id) DO NOTHING`,
      [booking.id, order.id, booking.total_amount],
    );

    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/payments/verify
async function verifyPayment(req, res, next) {
  try {
    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      bookingId,
      method,
    } = req.body;

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ error: "Payment details required" });
    }

    // Verify HMAC signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpayOrderId}|${razorpayPaymentId}`)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return res
        .status(400)
        .json({ error: "Payment verification failed — invalid signature" });
    }

    // Fetch payment details from Razorpay
    const payment = await razorpay.payments.fetch(razorpayPaymentId);

    // Update payment record
    await query(
      `UPDATE payments SET
         razorpay_payment_id = $1,
         razorpay_signature = $2,
         status = 'paid',
         method = $3,
         paid_at = NOW()
       WHERE razorpay_order_id = $4`,
      [
        razorpayPaymentId,
        razorpaySignature,
        payment.method || method || "unknown",
        razorpayOrderId,
      ],
    );

    // Confirm booking
    const { rows } = await query(
      `UPDATE bookings SET status = 'confirmed'
       WHERE uuid = $1 AND status = 'pending'
       RETURNING uuid, patient_name, slot_date, slot_time, total_amount / 100.0 AS total_amount`,
      [bookingId],
    );

    res.json({
      success: true,
      booking: rows[0] || null,
      paymentId: razorpayPaymentId,
    });
  } catch (err) {
    next(err);
  }
}

// POST /api/payments/webhook — Razorpay webhook handler
async function handleWebhook(req, res, next) {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (webhookSecret) {
      const signature = req.headers["x-razorpay-signature"];
      const body = JSON.stringify(req.body);
      const expected = crypto
        .createHmac("sha256", webhookSecret)
        .update(body)
        .digest("hex");

      if (expected !== signature) {
        return res.status(400).json({ error: "Invalid webhook signature" });
      }
    }

    const { event, payload } = req.body;

    if (event === "payment.captured") {
      const payment = payload.payment.entity;
      await query(
        `UPDATE payments SET status = 'paid', paid_at = NOW()
         WHERE razorpay_order_id = $1`,
        [payment.order_id],
      );
    }

    if (event === "payment.failed") {
      const payment = payload.payment.entity;
      await query(
        `UPDATE payments SET status = 'failed' WHERE razorpay_order_id = $1`,
        [payment.order_id],
      );
    }

    res.json({ received: true });
  } catch (err) {
    next(err);
  }
}

module.exports = { createOrder, verifyPayment, handleWebhook };
