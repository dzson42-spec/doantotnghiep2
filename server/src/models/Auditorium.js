import mongoose from 'mongoose';

const auditoriumSchema = new mongoose.Schema({
  theater: { type: mongoose.Schema.Types.ObjectId, ref: 'Theater', required: true },
  name: { type: String, required: true },
  type: { type: String, enum: ['standard', 'vip', 'imax', '4dx'], default: 'standard' },
  totalSeats: Number,
  rows: Number,
  columns: Number,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

auditoriumSchema.index({ theater: 1 });

const Auditorium = mongoose.model('Auditorium', auditoriumSchema);
export default Auditorium;
