import mongoose from 'mongoose';
import slugify from 'slugify';

const genreSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  slug: { type: String, unique: true },
  isActive: { type: Boolean, default: true }
});

genreSchema.pre('save', function(next) {
  if (this.isModified('name') && !this.slug) {
    this.slug = slugify(this.name, { lower: true, strict: true });
  }
  next();
});

const Genre = mongoose.model('Genre', genreSchema);
export default Genre;
