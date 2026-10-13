import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User.js";

const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { id: userId },
    process.env.JWT_ACCESS_SECRET || "default_jwt_secret_please_change",
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" },
  );

  const refreshToken = jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || "default_refresh_secret_please_change",
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" },
  );

  return { accessToken, refreshToken };
};

export const register = async (userData) => {
  const { name, email, phone, password } = userData;

  const existingEmail = await User.findOne({ email });
  if (existingEmail) {
    const error = new Error("Email already in use");
    error.statusCode = 400;
    throw error;
  }

  if (phone) {
    const existingPhone = await User.findOne({ phone });
    if (existingPhone) {
      const error = new Error("Phone number already in use");
      error.statusCode = 400;
      throw error;
    }
  }

  const user = new User({
    name,
    email,
    phone,
    passwordHash: password, // Pre-save hook will hash this
  });

  const { accessToken, refreshToken } = generateTokens(user._id);
  user.refreshTokens.push(refreshToken);
  await user.save();

  const userObj = user.toJSON();
  return { user: userObj, accessToken, refreshToken };
};

export const login = async (identifier, password) => {
  const normalizedIdentifier = identifier.includes("@")
    ? identifier.toLowerCase().trim()
    : identifier.trim();
  const candidates = [normalizedIdentifier];
  if (normalizedIdentifier.endsWith("@gmail")) {
    candidates.push(normalizedIdentifier + ".com");
  } else if (normalizedIdentifier.endsWith("@gmail.com")) {
    candidates.push(normalizedIdentifier.replace(/@gmail\.com$/, "@gmail"));
  }
  const user = await User.findOne({
    $or: [{ email: { $in: candidates } }, { phone: normalizedIdentifier }],
  }).select("+passwordHash");
  if (!user || !user.isActive) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const error = new Error("Invalid email or password");
    error.statusCode = 401;
    throw error;
  }

  const { accessToken, refreshToken } = generateTokens(user._id);

  user.refreshTokens.push(refreshToken);
  user.lastLogin = new Date();
  await user.save();

  const userObj = user.toJSON();
  return { user: userObj, accessToken, refreshToken };
};

export const logout = async (userId, refreshToken) => {
  const user = await User.findById(userId);
  if (user) {
    user.refreshTokens = user.refreshTokens.filter(
      (token) => token !== refreshToken,
    );
    await user.save();
  }
};

export const refreshToken = async (token) => {
  if (!token) {
    const error = new Error("Refresh token is required");
    error.statusCode = 401;
    throw error;
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_REFRESH_SECRET || "default_refresh_secret_please_change",
    );
    const user = await User.findById(decoded.id);

    if (!user || !user.refreshTokens.includes(token)) {
      throw new Error();
    }

    // Generate new access token
    const accessToken = jwt.sign(
      { id: user._id },
      process.env.JWT_ACCESS_SECRET || "default_jwt_secret_please_change",
      { expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m" },
    );

    return { accessToken };
  } catch {
    const error = new Error("Invalid or expired refresh token");
    error.statusCode = 401;
    throw error;
  }
};

export const forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  const hashedToken = crypto
    .createHash("sha256")
    .update(resetToken)
    .digest("hex");

  user.passwordResetToken = hashedToken;
  user.passwordResetExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  await user.save();

  // In a real app, send email here
  return resetToken;
};

export const resetPassword = async (token, newPassword) => {
  const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    const error = new Error("Token is invalid or has expired");
    error.statusCode = 400;
    throw error;
  }

  user.passwordHash = newPassword;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  // Invalidate all existing refresh tokens so user has to login again on all devices
  user.refreshTokens = [];
  await user.save();
};

export const getProfile = async (userId) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user.toJSON();
};

export const updateProfile = async (userId, data) => {
  const allowedFields = ["name", "phone", "address", "avatar"];
  const updates = Object.fromEntries(
    allowedFields
      .filter((field) => data[field] !== undefined)
      .map((field) => [field, data[field]]),
  );
  const user = await User.findByIdAndUpdate(userId, updates, {
    new: true,
    runValidators: true,
  });
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }
  return user.toJSON();
};

export const changePassword = async (userId, currentPassword, newPassword) => {
  const user = await User.findById(userId).select("+passwordHash");
  if (!user) {
    const error = new Error("User not found");
    error.statusCode = 404;
    throw error;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const error = new Error("Incorrect current password");
    error.statusCode = 401;
    throw error;
  }

  user.passwordHash = newPassword;
  // Optional: Invalidate other sessions
  await user.save();
};
