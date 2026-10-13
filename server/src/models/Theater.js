import mongoose from 'mongoose';
import slugify from 'slugify';

const theaterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, unique: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  phone: String,
  hotline: String,
  email: String,
  description: String,
  images: [String],
  facilities: [String],
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], required: true } // [longitude, latitude]
  },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

theaterSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

theaterSchema.index({ city: 1 });
theaterSchema.index({ location: '2dsphere' });

const Theater = mongoose.model('Theater', theaterSchema);
export default Theater;
