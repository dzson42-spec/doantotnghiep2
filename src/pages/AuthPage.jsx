import React, { useState, useEffect } from "react";
import { ArrowLeft, Film, Eye, EyeOff, Check, X, Loader2 } from "lucide-react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { forgotPassword, login, register, resetPassword } from "../lib/api";
import "./AuthPage.css";

const PASSWORD_RULES = [
  { id: 'length', label: 'Ít nhất 8 ký tự', test: (p) => p.length >= 8 },
  { id: 'lower', label: 'Chứa chữ thường (a-z)', test: (p) => /[a-z]/.test(p) },
  { id: 'upper', label: 'Chứa chữ hoa (A-Z)', test: (p) => /[A-Z]/.test(p) },
  { id: 'number', label: 'Chứa số (0-9)', test: (p) => /\d/.test(p) },
  { id: 'special', label: 'Chứa ký tự đặc biệt (!@#$...)', test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const getPasswordStrength = (password) => {
  if (!password) return { score: 0, label: '', color: '' };
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (passed <= 1) return { score: 1, label: 'Rất yếu', color: 'var(--strength-very-weak, #ef4444)' };
  if (passed === 2) return { score: 2, label: 'Yếu', color: 'var(--strength-weak, #f97316)' };
  if (passed === 3) return { score: 3, label: 'Trung bình', color: 'var(--strength-fair, #eab308)' };
  if (passed === 4) return { score: 4, label: 'Mạnh', color: 'var(--strength-strong, #22c55e)' };
  return { score: 5, label: 'Rất mạnh', color: 'var(--strength-very-strong, #16a34a)' };
};

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLogin, setIsLogin] = useState(
    searchParams.get("mode") === "register" || searchParams.get("email") ? false : true
  );
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resetToken, setResetToken] = useState("");
  const [resetPasswordValue, setResetPasswordValue] = useState("");

  // Redirect if already logged in
  useEffect(() => {
    const userStr = localStorage.getItem("currentUser");
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        if (["admin", "superadmin"].includes(u.role)) {
          navigate("/admin");
          return;
        }
      } catch {
        // ignore
      }
      navigate("/account");
    }
  }, [navigate]);

  // Sync mode from URL
  useEffect(() => {
    const mode = searchParams.get("mode");
    if (mode === "register") {
      setIsLogin(false);
      setIsForgotPassword(false);
    } else if (mode === "login") {
      setIsLogin(true);
      setIsForgotPassword(false);
    }
  }, [searchParams]);

  const validateRegisterForm = () => {
    const errors = {};
    if (!name.trim()) errors.name = "Vui lòng nhập họ tên";
    if (!email.trim()) {
      errors.email = "Vui lòng nhập email";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Định dạng email không hợp lệ";
    }
    if (phone && !/^(0|\+84)[0-9]{9,10}$/.test(phone.replace(/\s/g, ''))) {
      errors.phone = "Số điện thoại không hợp lệ";
    }
    if (!password || password.length < 6) {
      errors.password = "Mật khẩu phải có ít nhất 6 ký tự";
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = "Mật khẩu xác nhận không khớp";
    }
    return errors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setFieldErrors({});

    if (!isLogin) {
      const errors = validateRegisterForm();
      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const user = isLogin
        ? await login(email, password)
        : await register(name, email, password, phone);
      localStorage.setItem("currentUser", JSON.stringify(user));
      if (rememberMe) {
        localStorage.setItem("cinevite_remember_me", "true");
      }
      window.dispatchEvent(new Event("authChange"));
      if (["admin", "superadmin"].includes(user?.role)) {
        const token = localStorage.getItem("cinevite_access_token");
        if (token) localStorage.setItem("cinevite_admin_access_token", token);
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      setError(err.message || "Đã xảy ra lỗi, vui lòng thử lại");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      const token = await forgotPassword(email);
      setResetToken(token);
      setMessage(`Mã đặt lại mật khẩu (demo local): ${token}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");
    setIsSubmitting(true);
    try {
      await resetPassword(resetToken, resetPasswordValue);
      setMessage("Đổi mật khẩu thành công. Bạn có thể đăng nhập lại.");
      setResetToken("");
      setResetPasswordValue("");
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSocialLogin = (provider) => {
    setError("");
    const mockUser = {
      id: Date.now(),
      name: `Tài khoản ${provider}`,
      email: `user.${provider.toLowerCase()}@cinevite.vn`,
      role: "user",
    };
    localStorage.setItem("currentUser", JSON.stringify(mockUser));
    localStorage.setItem("cinevite_access_token", `mock_${provider.toLowerCase()}_token`);
    if (rememberMe) {
      localStorage.setItem("cinevite_remember_me", "true");
    }
    window.dispatchEvent(new Event("authChange"));
    setMessage(`Đăng nhập thành công với ${provider}! Đang chuyển hướng...`);
    setTimeout(() => {
      navigate("/");
    }, 600);
  };

  const switchMode = () => {
    setError("");
    setMessage("");
    setFieldErrors({});
    setPassword("");
    setConfirmPassword("");
    if (isForgotPassword) {
      setIsForgotPassword(false);
      setIsLogin(true);
      setResetToken("");
      setResetPasswordValue("");
      return;
    }
    setIsLogin((current) => !current);
  };

  const passwordStrength = getPasswordStrength(password);

  const title = isForgotPassword
    ? "Đặt lại mật khẩu"
    : isLogin
      ? "Chào mừng trở lại"
      : "Tạo tài khoản mới";
  const submitLabel = isSubmitting
    ? "Đang xử lý..."
    : isForgotPassword
      ? resetToken
        ? "Đổi mật khẩu"
        : "Gửi mã đặt lại"
      : isLogin
        ? "Đăng nhập"
        : "Tạo tài khoản";

  return (
    <div className="auth-page animate-fade-in">
      <div className="auth-page-layout">
        <section className="auth-page-intro">
          <Link to="/" className="auth-back-link">
            <ArrowLeft size={18} /> Về trang chủ
          </Link>
          <div className="auth-page-brand">
            <Film size={30} /> CineVite
          </div>
          <h1>Đặt vé hay, bắt đầu từ đây.</h1>
          <p>
            Lưu thông tin đặt vé và trải nghiệm điện ảnh thuận tiện hơn với tài
            khoản CineVite.
          </p>
        </section>

        <section className="auth-card">
          <div className="auth-card-heading">
            <span className="auth-kicker">TÀI KHOẢN CINEVITE</span>
            <h2>{title}</h2>
            <p>
              {isForgotPassword
                ? "Nhập email để nhận mã đặt lại mật khẩu."
                : isLogin
                  ? "Đăng nhập để tiếp tục đặt vé."
                  : "Đăng ký nhanh để bắt đầu đặt vé."}
            </p>
          </div>
          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}
          {message && (
            <div className="auth-success" role="status">
              {message}
            </div>
          )}

          <form
            className="auth-form"
            onSubmit={
              isForgotPassword
                ? resetToken
                  ? handleResetPassword
                  : handleForgotPassword
                : handleSubmit
            }
          >
            {/* --- Registration: Name --- */}
            {!isLogin && !isForgotPassword && (
              <div className={`form-group ${fieldErrors.name ? 'has-error' : ''}`}>
                <label htmlFor="auth-name">Họ tên <span className="required">*</span></label>
                <input
                  id="auth-name"
                  type="text"
                  placeholder="Nhập họ tên"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
                {fieldErrors.name && <span className="field-error">{fieldErrors.name}</span>}
              </div>
            )}

            {/* --- Registration: Phone --- */}
            {!isLogin && !isForgotPassword && (
              <div className={`form-group ${fieldErrors.phone ? 'has-error' : ''}`}>
                <label htmlFor="auth-phone">Số điện thoại</label>
                <input
                  id="auth-phone"
                  type="tel"
                  placeholder="VD: 0901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {fieldErrors.phone && <span className="field-error">{fieldErrors.phone}</span>}
              </div>
            )}

            {/* --- Email --- */}
            <div className={`form-group ${fieldErrors.email ? 'has-error' : ''}`}>
              <label htmlFor="auth-email">
                {isLogin && !isForgotPassword
                  ? "Email hoặc số điện thoại"
                  : "Email"}
                {!isLogin && !isForgotPassword && <span className="required">*</span>}
              </label>
              <input
                id="auth-email"
                type={isLogin && !isForgotPassword ? "text" : "email"}
                placeholder={
                  isLogin && !isForgotPassword
                    ? "Email hoặc số điện thoại"
                    : "you@example.com"
                }
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {fieldErrors.email && <span className="field-error">{fieldErrors.email}</span>}
            </div>

            {/* --- Forgot Password: Reset Token --- */}
            {isForgotPassword && resetToken && (
              <div className="form-group">
                <label htmlFor="reset-token">Mã đặt lại</label>
                <input
                  id="reset-token"
                  value={resetToken}
                  onChange={(e) => setResetToken(e.target.value)}
                  required
                />
              </div>
            )}
            {isForgotPassword && resetToken && (
              <div className="form-group">
                <label htmlFor="reset-password">Mật khẩu mới</label>
                <input
                  id="reset-password"
                  type="password"
                  placeholder="Tối thiểu 8 ký tự"
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  required
                />
              </div>
            )}

            {/* --- Password --- */}
            {!isForgotPassword && (
              <div className={`form-group ${fieldErrors.password ? 'has-error' : ''}`}>
                <label htmlFor="auth-password">Mật khẩu {!isLogin && <span className="required">*</span>}</label>
                <div className="password-input-wrapper">
                  <input
                    id="auth-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Tối thiểu 8 ký tự"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && <span className="field-error">{fieldErrors.password}</span>}

                {/* Password strength indicator - only on register */}
                {!isLogin && password && (
                  <div className="password-strength">
                    <div className="strength-bar-track">
                      {[1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`strength-bar-segment ${passwordStrength.score >= level ? 'active' : ''}`}
                          style={passwordStrength.score >= level ? { backgroundColor: passwordStrength.color } : {}}
                        />
                      ))}
                    </div>
                    <span className="strength-label" style={{ color: passwordStrength.color }}>
                      {passwordStrength.label}
                    </span>
                    <ul className="password-rules">
                      {PASSWORD_RULES.map((rule) => (
                        <li key={rule.id} className={rule.test(password) ? 'rule-pass' : 'rule-fail'}>
                          {rule.test(password) ? <Check size={14} /> : <X size={14} />}
                          {rule.label}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* --- Confirm Password (register only) --- */}
            {!isLogin && !isForgotPassword && (
              <div className={`form-group ${fieldErrors.confirmPassword ? 'has-error' : ''}`}>
                <label htmlFor="auth-confirm-password">Xác nhận mật khẩu <span className="required">*</span></label>
                <div className="password-input-wrapper">
                  <input
                    id="auth-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.confirmPassword && <span className="field-error">{fieldErrors.confirmPassword}</span>}
                {!fieldErrors.confirmPassword && confirmPassword && password === confirmPassword && (
                  <span className="field-success"><Check size={14} /> Mật khẩu khớp</span>
                )}
              </div>
            )}

            {/* --- Remember Me (login only) --- */}
            {isLogin && !isForgotPassword && (
              <div className="form-group-inline">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-custom"></span>
                  Ghi nhớ đăng nhập
                </label>
              </div>
            )}

            <button
              type="submit"
              className="btn btn-primary btn-full"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 size={18} className="spin-icon" />}
              {submitLabel}
            </button>
          </form>

          {isLogin && !isForgotPassword && (
            <button
              className="switch-btn auth-forgot"
              type="button"
              onClick={() => {
                setIsForgotPassword(true);
                setError("");
                setMessage("");
              }}
            >
              Quên mật khẩu?
            </button>
          )}

          {/* Social Logins */}
          {!isForgotPassword && (
            <div className="auth-social-section">
              <div className="auth-divider">
                <span>Hoặc tiếp tục với</span>
              </div>
              <div className="auth-social-buttons">
                <button
                  type="button"
                  className="social-btn google-btn"
                  onClick={() => handleSocialLogin("Google")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24">
                    <path
                      fill="#EA4335"
                      d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.4l3.7 2.9C6.5 7.4 9 5 12 5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.6 14.7c-.2-.7-.4-1.5-.4-2.7 0-1.1.2-2 .4-2.7L1.9 6.4C.7 8.8 0 10.8 0 12c0 1.2.7 3.2 1.9 5.6l3.7-2.9z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.3L1.9 16C3.7 19.8 7.5 23 12 23z"
                    />
                  </svg>
                  <span>Google</span>
                </button>
                <button
                  type="button"
                  className="social-btn facebook-btn"
                  onClick={() => handleSocialLogin("Facebook")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="#1877F2">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span>Facebook</span>
                </button>
                <button
                  type="button"
                  className="social-btn apple-btn"
                  onClick={() => handleSocialLogin("Apple")}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.37c.61-.75 1.04-1.8 0.92-2.87-.93.04-2.02.63-2.66 1.39-.56.65-.96 1.7-.84 2.72 1.04.08 2.05-.56 2.58-1.24z" />
                  </svg>
                  <span>Apple</span>
                </button>
              </div>
            </div>
          )}
          <p className="auth-switch">
            {isForgotPassword
              ? "Đã nhớ mật khẩu? "
              : isLogin
                ? "Chưa có tài khoản? "
                : "Đã có tài khoản? "}
            <button className="switch-btn" type="button" onClick={switchMode}>
              {isForgotPassword
                ? "Đăng nhập"
                : isLogin
                  ? "Đăng ký ngay"
                  : "Đăng nhập"}
            </button>
          </p>
        </section>
      </div>
    </div>
  );
};

export default AuthPage;
