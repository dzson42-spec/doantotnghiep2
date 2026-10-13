import mongoose from 'mongoose';

const promotionSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  name: { type: String, required: true },
  description: String,
  type: { type: String, enum: ['percentage', 'fixed'], required: true },
  value: { type: Number, required: true },
  minOrderAmount: { type: Number, default: 0 },
  maxDiscount: Number,
  usageLimit: Number,
  usedCount: { type: Number, default: 0 },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  isActive: { type: Boolean, default: true },
  applicableMovies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Movie' }],
  applicableTheaters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Theater' }]
}, { timestamps: true });

promotionSchema.index({ startDate: 1, endDate: 1 });

const Promotion = mongoose.model('Promotion', promotionSchema);
export default Promotion;
