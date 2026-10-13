import { Router } from "express";
import crypto from "crypto";
import { requireAuth, requireRoles } from "../middleware/auth.middleware.js";
import {
  AuditLog,
  Booking,
  Combo,
  Movie,
  Promotion,
  Review,
  Showtime,
  Setting,
  Theater,
  User,
} from "../models/index.js";

const router = Router();

router.use(requireAuth, requireRoles("admin", "superadmin"));

// ==========================================
// 1. DASHBOARD & ANALYTICS
// ==========================================
router.get("/dashboard/summary", async (req, res) => {
  const [movies, theaters, showtimes, bookings, users, newUsers, revenue] =
    await Promise.all([
      Movie.countDocuments({ isActive: true }),
      Theater.countDocuments({ isActive: true }),
      Showtime.countDocuments({
        isActive: true,
        startTime: { $gte: new Date() },
      }),
      Booking.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      }),
      Booking.aggregate([
        { $match: { status: { $in: ["paid", "confirmed", "used"] } } },
        { $group: { _id: null, total: { $sum: "$finalAmount" } } },
      ]),
    ]);
  res.json({
    success: true,
    data: {
      role: req.user.role,
      movies,
      theaters,
      showtimes,
      bookings,
      users,
      newUsers,
      revenue: revenue[0]?.total || 0,
    },
  });
});

router.get("/reports/revenue", async (req, res, next) => {
  try {
    const [expected, actual] = await Promise.all([
      Booking.aggregate([
        {
          $match: {
            status: { $in: ["pending", "held", "paid", "confirmed", "used"] },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$finalAmount" },
            orders: { $sum: 1 },
          },
        },
      ]),
      Booking.aggregate([
        {
          $match: {
            status: { $in: ["paid", "confirmed", "used"] },
            paidAt: { $ne: null },
          },
        },
        {
          $group: {
            _id: null,
            total: { $sum: "$finalAmount" },
            orders: { $sum: 1 },
          },
        },
      ]),
    ]);
    return res.json({
      success: true,
      data: {
        expected: expected[0] || { total: 0, orders: 0 },
        actual: actual[0] || { total: 0, orders: 0 },
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.get("/reports/top-movies", async (req, res, next) => {
  try {
    const topMovies = await Booking.aggregate([
      { $match: { status: { $in: ["paid", "confirmed", "used"] } } },
      {
        $group: {
          _id: "$movieTitle",
          totalRevenue: { $sum: "$finalAmount" },
          ticketCount: { $sum: { $size: { $ifNull: ["$clientSeatLabels", []] } } },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalRevenue: -1 } },
      { $limit: 10 },
    ]);
    return res.json({ success: true, data: topMovies });
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// 2. ORDER / BOOKING MANAGEMENT & POS
// ==========================================
router.patch("/bookings/:id/collect", async (req, res, next) => {
  try {
    const booking = await Booking.findOneAndUpdate(
      { _id: req.params.id, status: { $in: ["pending", "held"] } },
      {
        status: "paid",
        paymentMethod: "cash",
        paidAt: new Date(),
        confirmedAt: new Date(),
      },
      { new: true },
    );
    if (!booking)
      return res
        .status(404)
        .json({
          success: false,
          message: "Đơn đặt vé không ở trạng thái chờ thanh toán",
        });
    return res.json({ success: true, data: booking });
  } catch (error) {
    return next(error);
  }
});

router.patch("/bookings/:id/status", async (req, res, next) => {
  try {
    const { status, cancelReason } = req.body;
    const update = { status };
    if (status === "used") update.usedAt = new Date();
    if (status === "paid") {
      update.paidAt = new Date();
      update.confirmedAt = new Date();
    }
    if (status === "cancelled") {
      update.cancelledAt = new Date();
      update.cancelReason = cancelReason || "Hủy bởi Quản trị viên";
    }
    const booking = await Booking.findByIdAndUpdate(req.params.id, update, { new: true });
    if (!booking) return res.status(404).json({ success: false, message: "Không tìm thấy đơn đặt vé" });
    
    await AuditLog.create({
      user: req.user._id,
      action: `update-booking-${status}`,
      resource: "Booking",
      resourceId: booking._id,
      changes: { status },
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.json({ success: true, data: booking });
  } catch (error) {
    return next(error);
  }
});

router.post("/bookings/manual", async (req, res, next) => {
  try {
    const { movieTitle, showDate, showTime, seats, totalAmount, customerName, customerPhone, customerEmail, paymentMethod } = req.body;
    const bookingCode = `POS${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const isPaid = paymentMethod !== "cash" || req.body.isPaid;
    
    const seatList = Array.isArray(seats) ? seats : (seats ? String(seats).split(",").map(s => s.trim()) : ["GHE-QUAY"]);

    const booking = await Booking.create({
      bookingCode,
      user: null,
      movieTitle: movieTitle || "Vé xem phim tại quầy",
      showDate: showDate || new Date().toISOString().split("T")[0],
      showTime: showTime || "19:00",
      clientSeatLabels: seatList,
      totalAmount: Number(totalAmount || 0),
      discount: 0,
      finalAmount: Number(totalAmount || 0),
      status: isPaid ? "paid" : "pending",
      paymentMethod: paymentMethod || "cash",
      paidAt: isPaid ? new Date() : undefined,
      confirmedAt: isPaid ? new Date() : undefined,
      customerName: customerName || "Khách mua tại quầy",
      customerPhone: customerPhone || "",
      customerEmail: customerEmail || "",
    });

    await AuditLog.create({
      user: req.user._id,
      action: "pos-create-booking",
      resource: "Booking",
      resourceId: booking._id,
      changes: { bookingCode, finalAmount: totalAmount },
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });

    return res.status(201).json({ success: true, data: booking });
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// 3. COMBOS (F&B / BẮP NƯỚC)
// ==========================================
router.get("/combos", async (req, res, next) => {
  try {
    const combos = await Combo.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: combos });
  } catch (error) {
    return next(error);
  }
});

router.post("/combos", async (req, res, next) => {
  try {
    const combo = await Combo.create(req.body);
    await AuditLog.create({
      user: req.user._id,
      action: "create-combo",
      resource: "Combo",
      resourceId: combo._id,
      changes: req.body,
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    return res.status(201).json({ success: true, data: combo });
  } catch (error) {
    return next(error);
  }
});

router.put("/combos/:id", async (req, res, next) => {
  try {
    const combo = await Combo.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.json({ success: true, data: combo });
  } catch (error) {
    return next(error);
  }
});

router.delete("/combos/:id", async (req, res, next) => {
  try {
    await Combo.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "Đã xóa combo thành công" });
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// 4. PROMOTIONS / VOUCHERS
// ==========================================
router.get("/promotions", async (req, res, next) => {
  try {
    const promotions = await Promotion.find().sort({ createdAt: -1 });
    return res.json({ success: true, data: promotions });
  } catch (error) {
    return next(error);
  }
});

router.post("/promotions", async (req, res, next) => {
  try {
    const promotion = await Promotion.create({
      ...req.body,
      code: req.body.code.trim().toUpperCase(),
      startDate: req.body.startDate || new Date(),
      endDate: req.body.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    });
    await AuditLog.create({
      user: req.user._id,
      action: "create-promotion",
      resource: "Promotion",
      resourceId: promotion._id,
      changes: { code: promotion.code, value: promotion.value },
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    return res.status(201).json({ success: true, data: promotion });
  } catch (error) {
    return next(error);
  }
});

router.put("/promotions/:id", async (req, res, next) => {
  try {
    const promotion = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true });
    return res.json({ success: true, data: promotion });
  } catch (error) {
    return next(error);
  }
});

router.delete("/promotions/:id", async (req, res, next) => {
  try {
    await Promotion.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "Đã xóa mã khuyến mãi" });
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// 5. REVIEWS MODERATION
// ==========================================
router.get("/reviews", async (req, res, next) => {
  try {
    const reviews = await Review.find()
      .populate("user", "name email")
      .populate("movie", "title")
      .sort({ createdAt: -1 });
    return res.json({ success: true, data: reviews });
  } catch (error) {
    return next(error);
  }
});

router.patch("/reviews/:id/approve", async (req, res, next) => {
  try {
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { isApproved: Boolean(req.body.isApproved) },
      { new: true }
    );
    return res.json({ success: true, data: review });
  } catch (error) {
    return next(error);
  }
});

router.delete("/reviews/:id", async (req, res, next) => {
  try {
    await Review.findByIdAndDelete(req.params.id);
    return res.json({ success: true, message: "Đã xóa đánh giá" });
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// 6. CMS (BANNERS & ARTICLES)
// ==========================================
router.get("/cms/banners", async (req, res, next) => {
  try {
    const setting = await Setting.findOne({ key: "cms_banners" });
    return res.json({ success: true, data: setting?.value || [] });
  } catch (error) {
    return next(error);
  }
});

router.post("/cms/banners", async (req, res, next) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { key: "cms_banners" },
      { value: req.body.banners || [], description: "Danh sách banner trang chủ" },
      { upsert: true, new: true }
    );
    return res.json({ success: true, data: setting.value });
  } catch (error) {
    return next(error);
  }
});

router.get("/cms/articles", async (req, res, next) => {
  try {
    const setting = await Setting.findOne({ key: "cms_articles" });
    return res.json({ success: true, data: setting?.value || [] });
  } catch (error) {
    return next(error);
  }
});

router.post("/cms/articles", async (req, res, next) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { key: "cms_articles" },
      { value: req.body.articles || [], description: "Danh sách bài viết tin tức" },
      { upsert: true, new: true }
    );
    return res.json({ success: true, data: setting.value });
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// 7. USER & RBAC MANAGEMENT
// ==========================================
router.get("/users", async (req, res, next) => {
  try {
    const page = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.min(
      Math.max(Number.parseInt(req.query.limit, 10) || 50, 1),
      100,
    );
    const filter = {};
    if (req.query.search)
      filter.$or = [
        { name: { $regex: req.query.search.trim(), $options: "i" } },
        { email: { $regex: req.query.search.trim(), $options: "i" } },
      ];
    if (req.query.role) filter.role = req.query.role;
    const [items, total] = await Promise.all([
      User.find(filter)
        .select("-passwordHash -refreshTokens")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      User.countDocuments(filter),
    ]);
    return res.json({
      success: true,
      data: {
        items,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    return next(error);
  }
});

router.patch("/users/:id/status", async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive: Boolean(req.body.isActive) },
      { new: true },
    ).select("-passwordHash -refreshTokens");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    await AuditLog.create({
      user: req.user._id,
      action: user.isActive ? "activate" : "deactivate",
      resource: "User",
      resourceId: user._id,
      changes: { isActive: user.isActive },
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    return res.json({ success: true, data: user });
  } catch (error) {
    return next(error);
  }
});

router.patch("/users/:id/role", async (req, res, next) => {
  try {
    const roles = ["user", "staff", "manager", "admin", "superadmin"];
    if (!roles.includes(req.body.role))
      return res.status(400).json({ success: false, message: "Invalid role" });
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role: req.body.role },
      { new: true, runValidators: true },
    ).select("-passwordHash -refreshTokens");
    if (!user)
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    await AuditLog.create({
      user: req.user._id,
      action: "change-role",
      resource: "User",
      resourceId: user._id,
      changes: { role: user.role },
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    return res.json({ success: true, data: user });
  } catch (error) {
    return next(error);
  }
});

// ==========================================
// 8. SETTINGS & AUDIT LOGS
// ==========================================
router.get("/settings", async (req, res, next) => {
  try {
    return res.json({
      success: true,
      data: await Setting.find().sort({ key: 1 }),
    });
  } catch (error) {
    return next(error);
  }
});

router.put("/settings/:key", async (req, res, next) => {
  try {
    const setting = await Setting.findOneAndUpdate(
      { key: req.params.key },
      {
        value: req.body.value,
        description: req.body.description,
        updatedBy: req.user._id,
      },
      { new: true, upsert: true, runValidators: true },
    );
    await AuditLog.create({
      user: req.user._id,
      action: "update-setting",
      resource: "Setting",
      resourceId: setting._id,
      changes: { value: setting.value },
      ip: req.ip,
      userAgent: req.get("user-agent"),
    });
    return res.json({ success: true, data: setting });
  } catch (error) {
    return next(error);
  }
});

router.get("/audit-logs", async (req, res, next) => {
  try {
    return res.json({
      success: true,
      data: await AuditLog.find()
        .sort({ createdAt: -1 })
        .limit(100)
        .populate("user", "name email role"),
    });
  } catch (error) {
    return next(error);
  }
});

export default router;
