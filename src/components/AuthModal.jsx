import React, { useState } from "react";
import { X } from "lucide-react";
import { login, register } from "../lib/api";
import "./AuthModal.css";

const AuthModal = ({ isOpen, onClose }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const user = isLogin
        ? await login(email, password)
        : await register(name, email, password);
      localStorage.setItem("currentUser", JSON.stringify(user));
      window.dispatchEvent(new Event("authChange"));
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay animate-fade-in">
      <div className="modal-content">
        <button className="modal-close" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 className="modal-title">{isLogin ? "Đăng Nhập" : "Đăng Ký"}</h2>

        {error && (
          <div className="auth-error" role="alert">
            {error}
          </div>
        )}

        <form className="auth-form" onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="form-group">
              <label>Họ tên</label>
              <input
                type="text"
                placeholder="Nhập họ tên"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              placeholder="Nhập email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Mật khẩu</label>
            <input
              type="password"
              placeholder="Nhập mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-full"
            style={{ marginTop: "1rem" }}
            disabled={isSubmitting}
          >
            {isSubmitting
              ? "Đang xử lý..."
              : isLogin
                ? "Đăng Nhập"
                : "Tạo Tài Khoản"}
          </button>
        </form>

        <p className="auth-switch">
          {isLogin ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
          <button
            className="switch-btn"
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError("");
            }}
          >
            {isLogin ? "Đăng ký ngay" : "Đăng nhập"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
