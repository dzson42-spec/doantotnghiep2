import {
  Auditorium,
  Movie,
  Seat,
  Showtime,
  Theater
} from '../models/index.js';

const asyncHandler = (handler) => (req, res, next) => {
  Promise.resolve(handler(req, res, next)).catch(next);
};

const send = (res, data, status = 200) => res.status(status).json({ success: true, data });

const getPagination = (req) => {
  const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 20, 1), 100);
  return { page, limit, skip: (page - 1) * limit };
};

export const listMovies = asyncHandler(async (req, res) => {
  const { page, limit, skip } = getPagination(req);
  const filter = { isActive: true };
  if (req.query.status) filter.status = req.query.status;
  if (req.query.search) filter.title = { $regex: req.query.search.trim(), $options: 'i' };

  const [items, total] = await Promise.all([
    Movie.find(filter).sort({ releaseDate: -1, createdAt: -1 }).skip(skip).limit(limit),
    Movie.countDocuments(filter)
  ]);
  return send(res, { items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
});

export const getMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findOne({ _id: req.params.id, isActive: true }).populate('genre');
  if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });
  return send(res, movie);
});

export const createMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.create(req.body);
  return send(res, movie, 201);
});

export const updateMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findById(req.params.id);
  if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });
  Object.assign(movie, req.body);
  await movie.save();
  return send(res, movie);
});

export const deleteMovie = asyncHandler(async (req, res) => {
  const movie = await Movie.findByIdAndUpdate(
    req.params.id,
    { isActive: false, status: 'ended' },
    { new: true, runValidators: true }
  );
  if (!movie) return res.status(404).json({ success: false, message: 'Movie not found' });
  return send(res, movie);
});

export const listTheaters = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.city) filter.city = req.query.city;
  const theaters = await Theater.find(filter).sort({ city: 1, name: 1 });
  return send(res, theaters);
});

export const createTheater = asyncHandler(async (req, res) => {
  const theater = await Theater.create(req.body);
  return send(res, theater, 201);
});

export const updateTheater = asyncHandler(async (req, res) => {
  const theater = await Theater.findById(req.params.id);
  if (!theater) return res.status(404).json({ success: false, message: 'Theater not found' });
  Object.assign(theater, req.body);
  await theater.save();
  return send(res, theater);
});

export const deleteTheater = asyncHandler(async (req, res) => {
  const theater = await Theater.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true, runValidators: true }
  );
  if (!theater) return res.status(404).json({ success: false, message: 'Theater not found' });
  return send(res, theater);
});

export const listAuditoriums = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.theater) filter.theater = req.query.theater;
  const auditoriums = await Auditorium.find(filter).populate('theater', 'name city').sort({ name: 1 });
  return send(res, auditoriums);
});

export const createAuditorium = asyncHandler(async (req, res) => {
  const auditorium = await Auditorium.create(req.body);
  return send(res, auditorium, 201);
});

export const updateAuditorium = asyncHandler(async (req, res) => {
  const auditorium = await Auditorium.findById(req.params.id);
  if (!auditorium) return res.status(404).json({ success: false, message: 'Auditorium not found' });
  Object.assign(auditorium, req.body);
  await auditorium.save();
  return send(res, auditorium);
});

export const deleteAuditorium = asyncHandler(async (req, res) => {
  const auditorium = await Auditorium.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true, runValidators: true }
  );
  if (!auditorium) return res.status(404).json({ success: false, message: 'Auditorium not found' });
  return send(res, auditorium);
});

export const listSeats = asyncHandler(async (req, res) => {
  const seats = await Seat.find({ auditorium: req.params.auditoriumId, isActive: true })
    .sort({ row: 1, number: 1 });
  return send(res, seats);
});

export const createSeats = asyncHandler(async (req, res) => {
  const { seats } = req.body;
  if (!Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ success: false, message: 'seats must be a non-empty array' });
  }

  const documents = seats.map((seat) => ({
    ...seat,
    auditorium: req.params.auditoriumId
  }));
  const created = await Seat.insertMany(documents, { ordered: true });
  return send(res, created, 201);
});

export const updateSeat = asyncHandler(async (req, res) => {
  const seat = await Seat.findOneAndUpdate(
    { _id: req.params.id, auditorium: req.params.auditoriumId },
    req.body,
    { new: true, runValidators: true }
  );
  if (!seat) return res.status(404).json({ success: false, message: 'Seat not found' });
  return send(res, seat);
});

export const listShowtimes = asyncHandler(async (req, res) => {
  const filter = { isActive: true };
  if (req.query.movie) filter.movie = req.query.movie;
  if (req.query.theater) filter.theater = req.query.theater;
  if (req.query.from) filter.startTime = { $gte: new Date(req.query.from) };

  const showtimes = await Showtime.find(filter)
    .populate('movie', 'title poster duration')
    .populate('theater', 'name city')
    .populate('auditorium', 'name type')
    .sort({ startTime: 1 });
  return send(res, showtimes);
});

export const createShowtime = asyncHandler(async (req, res) => {
  const { auditorium, startTime, endTime } = req.body;
  const overlap = await Showtime.exists({
    auditorium,
    isActive: true,
    startTime: { $lt: new Date(endTime) },
    endTime: { $gt: new Date(startTime) }
  });
  if (overlap) {
    return res.status(409).json({ success: false, message: 'Showtime overlaps an existing showtime' });
  }

  const showtime = await Showtime.create(req.body);
  return send(res, showtime, 201);
});

export const updateShowtime = asyncHandler(async (req, res) => {
  const current = await Showtime.findById(req.params.id);
  if (!current) return res.status(404).json({ success: false, message: 'Showtime not found' });

  const next = { ...current.toObject(), ...req.body };
  const overlap = await Showtime.exists({
    _id: { $ne: current._id },
    auditorium: next.auditorium,
    isActive: true,
    startTime: { $lt: new Date(next.endTime) },
    endTime: { $gt: new Date(next.startTime) }
  });
  if (overlap) {
    return res.status(409).json({ success: false, message: 'Showtime overlaps an existing showtime' });
  }

  Object.assign(current, req.body);
  await current.save();
  return send(res, current);
});

export const deleteShowtime = asyncHandler(async (req, res) => {
  const showtime = await Showtime.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true, runValidators: true }
  );
  if (!showtime) return res.status(404).json({ success: false, message: 'Showtime not found' });
  return send(res, showtime);
});

