import mongoose from 'mongoose';

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  rating: { type: Number, min: 1, max: 10, required: true },
  comment: String,
  isApproved: { type: Boolean, default: false }
}, { timestamps: true });

reviewSchema.index({ user: 1, movie: 1 }, { unique: true });

const Review = mongoose.model('Review', reviewSchema);
export default Review;
