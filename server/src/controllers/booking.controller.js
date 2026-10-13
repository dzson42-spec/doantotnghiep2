import * as bookingService from "../services/booking.service.js";

export const holdSeats = async (req, res, next) => {
  try {
    const booking = await bookingService.holdSeats({
      user: req.user,
      ...req.body,
    });
    return res.status(201).json({ success: true, data: booking });
  } catch (error) {
    return next(error);
  }
};

export const createClientBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.createClientBooking({
      user: req.user,
      booking: req.body.booking,
      paymentMethod: req.body.paymentMethod,
      customer: req.body.customer,
    });
    return res.status(201).json({ success: true, data: booking });
  } catch (error) {
    return next(error);
  }
};

export const listBookings = async (req, res, next) => {
  try {
    const data = await bookingService.listBookings({
      user: req.user,
      query: req.query,
    });
    return res.json({ success: true, data });
  } catch (error) {
    return next(error);
  }
};

export const getBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.getBooking(req.params.id, req.user);
    return res.json({ success: true, data: booking });
  } catch (error) {
    return next(error);
  }
};

export const cancelBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.cancelBooking(
      req.params.id,
      req.user,
      req.body.reason,
    );
    return res.json({ success: true, data: booking });
  } catch (error) {
    return next(error);
  }
};

export const mockPayBooking = async (req, res, next) => {
  try {
    const booking = await bookingService.mockPayBooking(
      req.params.id,
      req.user,
      req.body.method,
    );
    return res.json({ success: true, data: booking });
  } catch (error) {
    return next(error);
  }
};

export const expireBookings = async (req, res, next) => {
  try {
    const count = await bookingService.expireHeldBookings();
    return res.json({ success: true, data: { expired: count } });
  } catch (error) {
    return next(error);
  }
};

export const guestLookupBooking = async (req, res, next) => {
  try {
    const { code, contact } = req.query;
    if (!code || !contact) {
      return res.status(400).json({
        success: false,
        message: "Vui lòng nhập đầy đủ Mã vé và Số điện thoại hoặc Email",
      });
    }
    const booking = await bookingService.lookupBooking(code, contact);
    return res.json({ success: true, data: booking });
  } catch (error) {
    return next(error);
  }
};

export const claimBooking = async (req, res, next) => {
  try {
    const { code } = req.body;
    if (!code) {
      return res.status(400).json({
        success: false,
        message: "Mã vé không được để trống",
      });
    }
    const booking = await bookingService.claimBooking(code, req.user._id);
    return res.json({ success: true, data: booking, message: "Liên kết vé vào tài khoản thành công" });
  } catch (error) {
    return next(error);
  }
};
