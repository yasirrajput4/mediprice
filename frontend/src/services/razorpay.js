import { paymentsApi } from "./apiServices";

export async function initiateRazorpayPayment({
  bookingId,
  bookingUuid,
  userPhone,
  userName,
  onSuccess,
  onFailure,
}) {
  // 1. Create Razorpay order on backend
  const order = await paymentsApi.createOrder(bookingUuid);

  return new Promise((resolve, reject) => {
    const options = {
      key: order.keyId || import.meta.env.VITE_RAZORPAY_KEY,
      amount: order.amount,
      currency: order.currency || "INR",
      name: "MediPrice",
      description: "Hospital Service Booking",
      image: "/logo.svg",
      order_id: order.orderId,
      prefill: {
        name: userName || "",
        contact: userPhone || "",
      },
      theme: { color: "#2563EB" },
      modal: { ondismiss: () => reject(new Error("Payment dismissed")) },
      handler: async (response) => {
        try {
          const result = await paymentsApi.verify({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            razorpaySignature: response.razorpay_signature,
            bookingId: bookingUuid,
          });
          onSuccess?.(result);
          resolve(result);
        } catch (err) {
          onFailure?.(err);
          reject(err);
        }
      },
    };

    if (!window.Razorpay) {
      reject(new Error("Razorpay SDK not loaded"));
      return;
    }

    const rzp = new window.Razorpay(options);
    rzp.on("payment.failed", (response) => {
      onFailure?.(response.error);
      reject(new Error(response.error.description));
    });
    rzp.open();
  });
}
