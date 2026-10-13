import mongoose from 'mongoose';

const comboSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  items: [{
    name: String,
    quantity: Number
  }],
  price: { type: Number, required: true },
  originalPrice: Number,
  image: String,
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

const Combo = mongoose.model('Combo', comboSchema);
export default Combo;
