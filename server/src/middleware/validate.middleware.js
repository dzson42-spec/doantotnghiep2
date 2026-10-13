export const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body, {
    abortEarly: false,
    stripUnknown: true
  });

  if (error) {
    const firstMsg = error.details?.[0]?.message || 'Dữ liệu không hợp lệ';
    return res.status(400).json({
      success: false,
      message: firstMsg,
      details: error.details.map((detail) => detail.message)
    });
  }

  req.body = value;
  return next();
};

