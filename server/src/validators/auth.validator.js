import Joi from "joi";

const passwordPattern = /^.{6,}$/;
const passwordMessage = "Mật khẩu phải có ít nhất 6 ký tự";

export const registerSchema = Joi.object({
  name: Joi.string().trim().required().messages({
    "string.empty": "Vui lòng nhập họ tên",
    "any.required": "Vui lòng nhập họ tên",
  }),
  email: Joi.string().trim().email().required().messages({
    "string.email": "Định dạng email không hợp lệ",
    "string.empty": "Vui lòng nhập email",
    "any.required": "Vui lòng nhập email",
  }),
  phone: Joi.string().trim().optional().allow("").messages({
    "string.base": "Số điện thoại không hợp lệ",
  }),
  password: Joi.string().regex(passwordPattern).required().messages({
    "string.pattern.base": passwordMessage,
    "string.empty": "Vui lòng nhập mật khẩu",
    "any.required": "Vui lòng nhập mật khẩu",
  }),
});

export const loginSchema = Joi.object({
  identifier: Joi.string().required().messages({
    "string.empty": "Vui lòng nhập email hoặc số điện thoại",
    "any.required": "Vui lòng nhập email hoặc số điện thoại",
  }),
  password: Joi.string().required().messages({
    "string.empty": "Vui lòng nhập mật khẩu",
    "any.required": "Vui lòng nhập mật khẩu",
  }),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.email": "Định dạng email không hợp lệ",
  }),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().regex(passwordPattern).required().messages({
    "string.pattern.base": passwordMessage,
  }),
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().regex(passwordPattern).required().messages({
    "string.pattern.base": passwordMessage,
  }),
});
