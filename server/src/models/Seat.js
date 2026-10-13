import mongoose from 'mongoose';

const seatSchema = new mongoose.Schema({
  auditorium: { type: mongoose.Schema.Types.ObjectId, ref: 'Auditorium', required: true },
  row: { type: String, required: true },
  number: { type: Number, required: true },
  type: { type: String, enum: ['standard', 'vip', 'couple', 'disabled'], default: 'standard' },
  label: String,
  isActive: { type: Boolean, default: true },
  price: Number
});

seatSchema.pre('save', function(next) {
  if (!this.label) {
    this.label = `${this.row}${this.number}`;
  }
  next();
});

seatSchema.index({ auditorium: 1, row: 1, number: 1 }, { unique: true });

const Seat = mongoose.model('Seat', seatSchema);
export default Seat;
