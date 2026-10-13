import * as authService from "../services/auth.service.js";

const refreshCookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 7 * 24 * 60 * 60 * 1000,
};

const sendAuthResponse = (res, result, statusCode = 200) => {
  res.cookie("refreshToken", result.refreshToken, refreshCookieOptions);
  return res.status(statusCode).json({
    success: true,
    data: { user: result.user, accessToken: result.accessToken },
  });
};

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    return sendAuthResponse(res, result, 201);
  } catch (error) {
    return next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const result = await authService.login(
      req.body.identifier,
      req.body.password,
    );
    return sendAuthResponse(res, result);
  } catch (error) {
    return next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    await authService.logout(req.user._id, req.cookies.refreshToken);
    res.clearCookie("refreshToken", refreshCookieOptions);
    return res.json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.cookies.refreshToken);
    return res.json({ success: true, data: result });
  } catch (error) {
    return next(error);
  }
};

export const getMe = async (req, res) => {
  res.json({ success: true, data: { user: req.user.toJSON() } });
};

export const updateProfile = async (req, res, next) => {
  try {
    const user = await authService.updateProfile(req.user._id, req.body);
    return res.json({ success: true, data: { user } });
  } catch (error) {
    return next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    await authService.changePassword(
      req.user._id,
      req.body.currentPassword,
      req.body.newPassword,
    );
    return res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    return next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const token = await authService.forgotPassword(req.body.email);
    return res.json({ success: true, data: { resetToken: token } });
  } catch (error) {
    return next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    await authService.resetPassword(req.body.token, req.body.password);
    return res.json({ success: true, message: "Password reset successfully" });
  } catch (error) {
    return next(error);
  }
};
