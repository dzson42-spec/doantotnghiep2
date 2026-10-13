import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['momo', 'zalopay', 'vnpay', 'payos', 'card', 'cash'], required: true },
  provider: String,
  transactionId: String,
  status: { type: String, enum: ['pending', 'success', 'failed', 'refunded'], default: 'pending' },
  metadata: mongoose.Schema.Types.Mixed,
  paidAt: Date,
  refundedAt: Date
}, { timestamps: true });

paymentSchema.index({ booking: 1 });
paymentSchema.index({ transactionId: 1 });

const Payment = mongoose.model('Payment', paymentSchema);
export default Payment;
