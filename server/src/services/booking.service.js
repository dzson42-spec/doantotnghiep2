import crypto from "crypto";
import { Booking, Seat, Showtime } from "../models/index.js";

const ACTIVE_STATUSES = ["held", "pending", "paid", "confirmed"];

const createBookingCode = () =>
  `CV${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

export const createClientBooking = async ({ user, booking, paymentMethod, customer }) => {
  if (
    !booking?.selectedSeats?.length ||
    !booking.movie?.title ||
    !booking.showtimeId
  ) {
    const error = new Error("Thông tin đặt vé chưa đầy đủ");
    error.statusCode = 400;
    throw error;
  }
  const totalAmount =
    Number(booking.totalPrice) ||
    booking.selectedSeats.reduce(
      (sum, seat) => sum + Number(seat.price || 0),
      0,
    );
  const discount = Number(booking.discount || 0);
  const finalAmount = Math.max(Number(booking.finalAmount ?? (totalAmount - discount)), 0);

  if (totalAmount <= 0) {
    const error = new Error("Số tiền đặt vé không hợp lệ");
    error.statusCode = 400;
    throw error;
  }
  const isPaid = paymentMethod !== "cash";
  const customerName = customer?.name || user?.name || booking?.customer?.name || "Khách vãng lai";
  const customerEmail = customer?.email || user?.email || booking?.customer?.email || "";
  const customerPhone = customer?.phone || user?.phone || booking?.customer?.phone || "";

  return Booking.create({
    bookingCode: createBookingCode(),
    user: user?._id || null,
    clientShowtimeId: String(booking.showtimeId),
    movieTitle: booking.movie.title,
    showDate: booking.date,
    showTime: booking.time,
    clientSeatLabels: booking.selectedSeats.map((seat) => seat.id),
    totalAmount,
    discount,
    finalAmount,
    status: isPaid ? "paid" : "pending",
    paymentMethod,
    paidAt: isPaid ? new Date() : undefined,
    confirmedAt: isPaid ? new Date() : undefined,
    customerName,
    customerEmail,
    customerPhone,
  });
};

export const expireHeldBookings = async () => {
  const result = await Booking.updateMany(
    { status: "held", expiresAt: { $lte: new Date() } },
    { $set: { status: "expired" } },
  );
  return result.modifiedCount;
};

export const holdSeats = async ({ user, showtimeId, seatIds, customer }) => {
  if (!Array.isArray(seatIds) || seatIds.length === 0 || seatIds.length > 8) {
    const error = new Error("Choose between 1 and 8 seats");
    error.statusCode = 400;
    throw error;
  }

  const uniqueSeatIds = [...new Set(seatIds.map(String))];
  if (uniqueSeatIds.length !== seatIds.length) {
    const error = new Error("Duplicate seats are not allowed");
    error.statusCode = 400;
    throw error;
  }

  await expireHeldBookings();
  const showtime = await Showtime.findOne({ _id: showtimeId, isActive: true });
  if (!showtime) {
    const error = new Error("Showtime not found");
    error.statusCode = 404;
    throw error;
  }

  const seats = await Seat.find({
    _id: { $in: uniqueSeatIds },
    auditorium: showtime.auditorium,
    isActive: true,
  });
  if (seats.length !== uniqueSeatIds.length) {
    const error = new Error(
      "One or more seats are invalid for this auditorium",
    );
    error.statusCode = 400;
    throw error;
  }

  const conflict = await Booking.exists({
    showtime: showtimeId,
    status: { $in: ACTIVE_STATUSES },
    "seats.seat": { $in: uniqueSeatIds },
  });
  if (conflict) {
    const error = new Error("One or more seats are no longer available");
    error.statusCode = 409;
    throw error;
  }

  const seatItems = seats.map((seat) => ({
    seat: seat._id,
    type: seat.type,
    price: showtime.price?.[seat.type] ?? seat.price ?? 0,
  }));
  const totalAmount = seatItems.reduce((sum, seat) => sum + seat.price, 0);
  if (totalAmount <= 0) {
    const error = new Error("Showtime does not have valid seat pricing");
    error.statusCode = 400;
    throw error;
  }

  const booking = await Booking.create({
    bookingCode: createBookingCode(),
    user: user._id,
    showtime: showtimeId,
    seats: seatItems,
    totalAmount,
    finalAmount: totalAmount,
    status: "held",
    expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    customerName: customer?.name || user.name,
    customerEmail: customer?.email || user.email,
    customerPhone: customer?.phone || user.phone,
  });

  return booking.populate([
    {
      path: "showtime",
      populate: [
        { path: "movie", select: "title poster" },
        { path: "theater", select: "name" },
      ],
    },
    { path: "seats.seat" },
  ]);
};

export const getBooking = async (bookingId, user) => {
  const filter = { _id: bookingId };
  if (!["staff", "manager", "admin", "superadmin"].includes(user.role))
    filter.user = user._id;
  const booking = await Booking.findOne(filter)
    .populate("showtime")
    .populate("seats.seat");
  if (!booking) {
    const error = new Error("Booking not found");
    error.statusCode = 404;
    throw error;
  }
  return booking;
};

export const listBookings = async ({ user, query }) => {
  const filter = {};
  if (!["staff", "manager", "admin", "superadmin"].includes(user.role))
    filter.user = user._id;
  if (query.status) filter.status = query.status;
  const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(
    Math.max(Number.parseInt(query.limit, 10) || 20, 1),
    100,
  );
  const [items, total] = await Promise.all([
    Booking.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("showtime"),
    Booking.countDocuments(filter),
  ]);
  return {
    items,
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
};

export const cancelBooking = async (bookingId, user, reason) => {
  const filter = { _id: bookingId, status: { $in: ["held", "pending"] } };
  if (!["staff", "manager", "admin", "superadmin"].includes(user.role))
    filter.user = user._id;
  const booking = await Booking.findOneAndUpdate(
    filter,
    {
      status: "cancelled",
      cancelledAt: new Date(),
      cancelReason: reason || "Cancelled by user",
    },
    { new: true },
  );
  if (!booking) {
    const error = new Error("Booking cannot be cancelled");
    error.statusCode = 404;
    throw error;
  }
  return booking;
};

export const mockPayBooking = async (bookingId, user, method = "cash") => {
  const filter = {
    _id: bookingId,
    user: user._id,
    status: "held",
    expiresAt: { $gt: new Date() },
  };
  const booking = await Booking.findOneAndUpdate(
    filter,
    {
      status: "paid",
      paymentMethod: method,
      paidAt: new Date(),
      confirmedAt: new Date(),
    },
    { new: true },
  );
  if (!booking) {
    const error = new Error("Booking is unavailable or expired");
    error.statusCode = 409;
    throw error;
  }
  return booking;
};

export const lookupBooking = async (code, contact) => {
  const normalizedCode = code.trim().toUpperCase();
  const normalizedContact = contact.trim().toLowerCase();

  const booking = await Booking.findOne({
    bookingCode: normalizedCode,
    $or: [
      { customerEmail: { $regex: new RegExp(`^${normalizedContact.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, "i") } },
      { customerPhone: contact.trim() },
    ],
  });

  if (!booking) {
    const error = new Error("Không tìm thấy vé phù hợp với mã và thông tin liên hệ đã cung cấp");
    error.statusCode = 404;
    throw error;
  }
  return booking;
};

export const claimBooking = async (code, userId) => {
  const normalizedCode = code.trim().toUpperCase();
  const booking = await Booking.findOneAndUpdate(
    { bookingCode: normalizedCode, user: null },
    { user: userId },
    { new: true }
  );
  if (!booking) {
    const error = new Error("Không thể liên kết vé hoặc vé đã thuộc về tài khoản khác");
    error.statusCode = 400;
    throw error;
  }
  return booking;
};
