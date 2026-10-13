import { Router } from "express";
import rateLimit from "express-rate-limit";
import {
  changePassword,
  forgotPassword,
  getMe,
  login,
  logout,
  refresh,
  register,
  resetPassword,
  updateProfile,
} from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { loginSchema, registerSchema } from "../validators/auth.validator.js";

const router = Router();

// Rate limiting: max 5 login attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: "Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting: max 5 register attempts per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { message: "Quá nhiều lần đăng ký. Vui lòng thử lại sau." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting: max 3 forgot-password attempts per 15 minutes
const forgotPasswordLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 3,
  message: { message: "Quá nhiều yêu cầu đặt lại mật khẩu. Vui lòng thử lại sau." },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post("/register", registerLimiter, validate(registerSchema), register);
router.post("/login", loginLimiter, validate(loginSchema), login);
router.post("/refresh", refresh);
router.post("/forgot-password", forgotPasswordLimiter, forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/logout", requireAuth, logout);
router.get("/me", requireAuth, getMe);
router.patch("/profile", requireAuth, updateProfile);
router.post("/change-password", requireAuth, changePassword);

export default router;
