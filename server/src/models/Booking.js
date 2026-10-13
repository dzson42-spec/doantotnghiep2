import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingCode: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: false },
    showtime: { type: mongoose.Schema.Types.ObjectId, ref: "Showtime" },
    clientShowtimeId: String,
    movieTitle: String,
    showDate: String,
    showTime: String,
    seats: [
      {
        seat: { type: mongoose.Schema.Types.ObjectId, ref: "Seat" },
        price: Number,
        type: String,
      },
    ],
    clientSeatLabels: [String],
    totalAmount: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    finalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: [
        "pending",
        "held",
        "paid",
        "confirmed",
        "used",
        "cancelled",
        "expired",
        "refunded",
      ],
      default: "pending",
    },
    paymentMethod: String,
    paymentId: String,
    promotion: { type: mongoose.Schema.Types.ObjectId, ref: "Promotion" },
    combos: [
      {
        combo: { type: mongoose.Schema.Types.ObjectId, ref: "Combo" },
        quantity: Number,
        price: Number,
      },
    ],
    customerName: String,
    customerEmail: String,
    customerPhone: String,
    qrCode: String,
    expiresAt: Date,
    paidAt: Date,
    confirmedAt: Date,
    usedAt: Date,
    cancelledAt: Date,
    cancelReason: String,
    refundedAt: Date,
    refundAmount: Number,
  },
  { timestamps: true },
);

bookingSchema.index({ user: 1 });
bookingSchema.index({ showtime: 1 });
bookingSchema.index({ status: 1 });

const Booking = mongoose.model("Booking", bookingSchema);
export default Booking;
