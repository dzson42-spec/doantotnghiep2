import mongoose from 'mongoose';

const showtimeSchema = new mongoose.Schema({
  movie: { type: mongoose.Schema.Types.ObjectId, ref: 'Movie', required: true },
  theater: { type: mongoose.Schema.Types.ObjectId, ref: 'Theater', required: true },
  auditorium: { type: mongoose.Schema.Types.ObjectId, ref: 'Auditorium', required: true },
  startTime: { type: Date, required: true },
  endTime: { type: Date, required: true },
  price: {
    standard: Number,
    vip: Number,
    couple: Number
  },
  format: String,
  language: String,
  subtitles: String,
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

showtimeSchema.index({ auditorium: 1, startTime: 1 });
showtimeSchema.index({ movie: 1 });
showtimeSchema.index({ theater: 1 });

showtimeSchema.virtual('isSoldOut').get(function() {
  return false; // Can be dynamically calculated based on available seats
});

const Showtime = mongoose.model('Showtime', showtimeSchema);
export default Showtime;
