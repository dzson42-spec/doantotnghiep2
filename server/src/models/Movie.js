import mongoose from 'mongoose';
import slugify from 'slugify';

const movieSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, unique: true },
  synopsis: String,
  genre: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Genre' }],
  duration: { type: Number, required: true },
  releaseDate: Date,
  endDate: Date,
  director: String,
  cast: [String],
  ageRating: { type: String, enum: ['P', 'T13', 'T16', 'T18'], default: 'P' },
  format: [String],
  language: String,
  subtitles: String,
  poster: String,
  backdrop: String,
  trailerUrl: String,
  rating: {
    average: { type: Number, default: 0 },
    count: { type: Number, default: 0 }
  },
  status: { type: String, enum: ['draft', 'showing', 'upcoming', 'ended'], default: 'draft' },
  isActive: { type: Boolean, default: true }
}, { timestamps: true });

movieSchema.pre('save', function(next) {
  if (this.isModified('title') && !this.slug) {
    this.slug = slugify(this.title, { lower: true, strict: true });
  }
  next();
});

movieSchema.index({ status: 1 });
movieSchema.index({ releaseDate: 1 });

const Movie = mongoose.model('Movie', movieSchema);
export default Movie;
