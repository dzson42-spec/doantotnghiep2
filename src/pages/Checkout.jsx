import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { CheckCircle, ArrowLeft, Loader2, Sparkles, Tag, Check, ShieldCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import ImgWithFallback from "../components/ImgWithFallback";
import { apiRequest, register, validatePromotion, claimGuestBooking } from "../lib/api";
import "./Checkout.css";

const Checkout = () => {
  const navigate = useNavigate();
  const [booking, setBooking] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [paymentError, setPaymentError] = useState("");
  const [ticketCode, setTicketCode] = useState("");
  
  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponMessage, setCouponMessage] = useState("");
  const [couponError, setCouponError] = useState("");

  // 1-Click register state on thank you page
  const [oneClickPassword, setOneClickPassword] = useState("");
  const [oneClickLoading, setOneClickLoading] = useState(false);
  const [oneClickSuccess, setOneClickSuccess] = useState(false);
  const [oneClickError, setOneClickError] = useState("");

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser"));
    } catch {
      return null;
    }
  });

  const [formData, setFormData] = useState({
    name: currentUser?.name || "",
    email: currentUser?.email || "",
    phone: currentUser?.phone || "",
    paymentMethod: "momo",
  });

  useEffect(() => {
    const data = localStorage.getItem("tempBooking");
    if (data) {
      setBooking(JSON.parse(data));
    } else {
      navigate("/");
    }
  }, [navigate]);

  if (!booking) return null;

  const originalTotal = Number(booking.totalPrice || 0);
  const discountAmount = appliedCoupon ? appliedCoupon.discount : 0;
  const finalTotal = Math.max(0, originalTotal - discountAmount);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponCode).trim().toUpperCase();
    if (!code) return;
    setCouponLoading(true);
    setCouponError("");
    setCouponMessage("");
    try {
      const data = await validatePromotion(code, originalTotal);
      setAppliedCoupon(data);
      setCouponMessage(`Áp dụng thành công: ${data.name}`);
      setCouponCode(code);
    } catch (err) {
      setCouponError(err.message || "Mã khuyến mãi không hợp lệ");
      setAppliedCoupon(null);
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
    setCouponMessage("");
    setCouponError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPaymentError("");
    setIsLoading(true);

    try {
      // 1. Update local seat cache
      const currentSeatsStr = localStorage.getItem(`seats_${booking.showtimeId}`);
      if (currentSeatsStr) {
        const currentSeats = JSON.parse(currentSeatsStr);
        const bookedSeatIds = booking.selectedSeats.map((s) => s.id);
        const updatedSeats = currentSeats.map((s) =>
          bookedSeatIds.includes(s.id) ? { ...s, status: "booked" } : s,
        );
        localStorage.setItem(`seats_${booking.showtimeId}`, JSON.stringify(updatedSeats));
      }

      // 2. Call backend client-complete for BOTH guest & logged in user
      const payload = {
        booking: {
          ...booking,
          discount: discountAmount,
          finalAmount: finalTotal,
        },
        paymentMethod: formData.paymentMethod,
        customer: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
        },
      };

      const savedBooking = await apiRequest("/bookings/client-complete", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const completedTicketCode = savedBooking.bookingCode;

      // 3. Save local booking history
      const historyKey = currentUser?.email || formData.email || "guest";
      const history = JSON.parse(localStorage.getItem(`booking_history_${historyKey}`) || "[]");
      history.unshift({
        _id: savedBooking._id || completedTicketCode,
        bookingCode: completedTicketCode,
        movie: { title: booking.movie.title },
        date: booking.date,
        time: booking.time,
        showtimeId: booking.showtimeId,
        seats: booking.selectedSeats,
        totalAmount: originalTotal,
        discount: discountAmount,
        finalAmount: finalTotal,
        status: formData.paymentMethod === "cash" ? "pending" : "paid",
        customerName: formData.name,
        customerEmail: formData.email,
        customerPhone: formData.phone,
        createdAt: new Date().toISOString(),
      });
      localStorage.setItem(`booking_history_${historyKey}`, JSON.stringify(history));

      setTicketCode(completedTicketCode);
      setIsSuccess(true);
      localStorage.removeItem("tempBooking");
    } catch (error) {
      setPaymentError(error.message || "Không thể hoàn tất thanh toán");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOneClickRegister = async (e) => {
    e.preventDefault();
    if (!oneClickPassword || oneClickPassword.length < 6) {
      setOneClickError("Mật khẩu cần tối thiểu 6 ký tự");
      return;
    }
    setOneClickLoading(true);
    setOneClickError("");
    try {
      const newUser = await register(formData.name, formData.email, oneClickPassword, formData.phone);
      localStorage.setItem("currentUser", JSON.stringify(newUser));
      setCurrentUser(newUser);

      // Claim the guest ticket to newly registered account
      if (ticketCode) {
        try {
          await claimGuestBooking(ticketCode);
        } catch {
          // ignore if already assigned
        }
      }

      window.dispatchEvent(new Event("authChange"));
      setOneClickSuccess(true);
    } catch (err) {
      setOneClickError(err.message || "Không thể tạo tài khoản");
    } finally {
      setOneClickLoading(false);
    }
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price);
  };

  if (isSuccess) {
    return (
      <div className="container success-container animate-fade-in">
        <CheckCircle size={80} className="success-icon" />
        <h1 className="success-title">Thanh Toán Thành Công!</h1>
        <p className="success-message">
          Cảm ơn <strong>{formData.name}</strong> đã đặt vé. Thông tin vé đã được gửi đến email <strong>{formData.email}</strong>.
        </p>

        <div className="ticket-card">
          <div className="ticket-header">
            <h3>Mã đặt vé: #{ticketCode}</h3>
          </div>
          <div
            className="ticket-body"
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <div className="ticket-details">
              <p>
                <strong>Phim:</strong> {booking.movie.title}
              </p>
              <p>
                <strong>Suất chiếu:</strong> {booking.time} - {new Date(booking.date).toLocaleDateString("vi-VN")}
              </p>
              <p>
                <strong>Ghế:</strong> {booking.selectedSeats.map((s) => s.id).join(", ")}
              </p>
              <p>
                <strong>Rạp:</strong> CineVite Landmark
              </p>
              <p>
                <strong>Trạng thái:</strong> {formData.paymentMethod === "cash" ? "Chờ thanh toán tại quầy" : "Đã thanh toán"}
              </p>
              {discountAmount > 0 && (
                <p>
                  <strong>Giảm giá:</strong> -{formatPrice(discountAmount)}
                </p>
              )}
              <p>
                <strong>Tổng thanh toán:</strong> {formatPrice(finalTotal)}
              </p>
            </div>
            <div
              className="ticket-qr"
              style={{
                padding: "1rem",
                backgroundColor: "white",
                borderRadius: "8px",
              }}
            >
              <QRCodeSVG
                value={`https://cinevite.local/ticket/${ticketCode}`}
                size={100}
              />
            </div>
          </div>
          <button
            className="btn btn-secondary btn-full"
            style={{ marginTop: "1.5rem" }}
            onClick={() => window.print()}
          >
            Tải vé điện tử (PDF / In)
          </button>
        </div>

        {/* 1-Click Register for Guests */}
        {!currentUser && (
          <div className="one-click-card animate-fade-in">
            <div className="one-click-header">
              <Sparkles size={24} color="#f43f5e" />
              <h3>Tạo tài khoản nhanh 1-Click</h3>
            </div>
            <p className="one-click-desc">
              Lưu lại vé vừa đặt, tích điểm thành viên và quản lý lịch sử đặt vé dễ dàng cho các lần xem phim sau mà không cần nhập lại thông tin.
            </p>

            {oneClickSuccess ? (
              <div className="one-click-success">
                <Check size={20} />
                <span>Chúc mừng! Tài khoản <strong>{formData.email}</strong> đã được tạo và vé đã liên kết vào tài khoản của bạn.</span>
              </div>
            ) : (
              <form className="one-click-form" onSubmit={handleOneClickRegister}>
                {oneClickError && <div className="checkout-error">{oneClickError}</div>}
                <div className="form-group">
                  <label>Email đăng ký</label>
                  <input
                    type="email"
                    value={formData.email}
                    disabled
                    style={{ opacity: 0.8 }}
                  />
                </div>
                <div className="form-group">
                  <label>Tạo mật khẩu</label>
                  <input
                    type="password"
                    placeholder="Nhập mật khẩu (tối thiểu 8 ký tự)..."
                    value={oneClickPassword}
                    onChange={(e) => setOneClickPassword(e.target.value)}
                    required
                    className="one-click-input"
                  />
                </div>
                <button
                  type="submit"
                  className="one-click-btn"
                  disabled={oneClickLoading}
                >
                  {oneClickLoading ? "Đang tạo tài khoản..." : "Tạo tài khoản & Đăng nhập ngay"}
                </button>
              </form>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: "1rem" }}>
          <Link to="/" className="btn btn-primary">
            Trở về Trang Chủ
          </Link>
          <Link to="/lookup" className="btn btn-secondary">
            Tra Cứu Vé Đã Đặt
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page container">
      <button className="back-btn" onClick={() => navigate(-1)}>
        <ArrowLeft size={20} /> Quay lại
      </button>

      <div className="checkout-grid">
        {/* Payment Form */}
        <div className="checkout-form-container">
          <h2 className="section-title">
            {currentUser ? "Thông tin người đặt vé" : "Đặt vé trực tiếp (Không cần tài khoản)"}
          </h2>

          <form onSubmit={handleSubmit} className="checkout-form">
            {paymentError && (
              <div className="checkout-error" role="alert">
                {paymentError}
              </div>
            )}

            <div className="form-group">
              <label htmlFor="name">Họ và tên *</label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nhập họ và tên..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="email">Email nhận vé *</label>
              <input
                type="email"
                id="email"
                name="email"
                required
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Nhập email để nhận vé điện tử..."
              />
            </div>
            <div className="form-group">
              <label htmlFor="phone">Số điện thoại *</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                required
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Nhập số điện thoại để tra cứu vé..."
              />
            </div>

            <h3 className="payment-method-title">Phương thức thanh toán</h3>
            <div className="payment-methods">
              <label
                className={`payment-method ${formData.paymentMethod === "momo" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="momo"
                  checked={formData.paymentMethod === "momo"}
                  onChange={handleInputChange}
                />
                <span>Ví MoMo</span>
              </label>
              <label
                className={`payment-method ${formData.paymentMethod === "cash" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="cash"
                  checked={formData.paymentMethod === "cash"}
                  onChange={handleInputChange}
                />
                <span>Thanh toán tại quầy</span>
              </label>
              <label
                className={`payment-method ${formData.paymentMethod === "zalopay" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="zalopay"
                  checked={formData.paymentMethod === "zalopay"}
                  onChange={handleInputChange}
                />
                <span>ZaloPay</span>
              </label>
              <label
                className={`payment-method ${formData.paymentMethod === "card" ? "active" : ""}`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  value="card"
                  checked={formData.paymentMethod === "card"}
                  onChange={handleInputChange}
                />
                <span>Thẻ ATM / Visa</span>
              </label>
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-submit"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2
                    className="animate-spin"
                    style={{
                      marginRight: "0.5rem",
                      animation: "spin 1s linear infinite",
                    }}
                  />
                  Đang xử lý đặt vé...
                </>
              ) : (
                `Xác nhận thanh toán (${formatPrice(finalTotal)})`
              )}
            </button>
          </form>
        </div>

        {/* Order Summary */}
        <div className="checkout-summary">
          <h2 className="summary-title">Tóm tắt đơn hàng</h2>

          <div className="summary-movie-info">
            <ImgWithFallback
              src={booking.movie.poster}
              alt={booking.movie.title}
              className="summary-poster"
            />
            <div>
              <h3 className="summary-movie-title">{booking.movie.title}</h3>
              <p className="summary-text">CineVite Landmark</p>
              <p className="summary-text">
                {booking.time} - {new Date(booking.date).toLocaleDateString("vi-VN")}
              </p>
            </div>
          </div>

          <div className="summary-items">
            <h4 className="summary-subtitle">Vé xem phim ({booking.selectedSeats.length} ghế)</h4>
            {booking.selectedSeats.map((seat) => (
              <div key={seat.id} className="summary-row">
                <span className="label">
                  Ghế {seat.id} ({seat.type === "couple" ? "Đôi" : seat.type === "vip" ? "VIP" : "Thường"})
                </span>
                <span className="value">{formatPrice(seat.price)}</span>
              </div>
            ))}
          </div>

          {/* Coupon / Voucher Section */}
          <div className="coupon-section">
            <h4 className="summary-subtitle" style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <Tag size={16} /> Mã khuyến mãi / Giảm giá
            </h4>
            
            {appliedCoupon ? (
              <div className="coupon-applied">
                <div>
                  <strong>{appliedCoupon.code}</strong> - {appliedCoupon.name}
                  <div>-{formatPrice(appliedCoupon.discount)}</div>
                </div>
                <button type="button" className="coupon-remove-btn" onClick={handleRemoveCoupon}>
                  Bỏ mã
                </button>
              </div>
            ) : (
              <div>
                <div className="coupon-form">
                  <input
                    type="text"
                    className="coupon-input"
                    placeholder="Nhập mã voucher..."
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                  />
                  <button
                    type="button"
                    className="coupon-btn"
                    disabled={couponLoading || !couponCode.trim()}
                    onClick={() => handleApplyCoupon()}
                  >
                    {couponLoading ? "..." : "Áp dụng"}
                  </button>
                </div>
                {couponError && <div className="checkout-error" style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>{couponError}</div>}
                {couponMessage && <div style={{ color: "#4ade80", fontSize: "0.85rem", marginTop: "0.5rem" }}>{couponMessage}</div>}
                <div className="coupon-hints">
                  <span style={{ fontSize: "0.75rem", color: "hsl(var(--color-text-secondary))" }}>Mã gợi ý:</span>
                  <span className="coupon-tag" onClick={() => handleApplyCoupon("CINEVITE10")}>CINEVITE10 (-10%)</span>
                  <span className="coupon-tag" onClick={() => handleApplyCoupon("VIP20K")}>VIP20K (-20k)</span>
                  <span className="coupon-tag" onClick={() => handleApplyCoupon("CHAOBANMOI")}>CHAOBANMOI (-30k)</span>
                </div>
              </div>
            )}
          </div>

          <div className="summary-total-border">
            <div className="summary-row" style={{ marginBottom: "0.5rem" }}>
              <span className="label">Tạm tính:</span>
              <span className="value">{formatPrice(originalTotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="summary-row" style={{ marginBottom: "0.5rem" }}>
                <span className="label">Giảm giá:</span>
                <span className="value summary-discount">-{formatPrice(discountAmount)}</span>
              </div>
            )}
            <div className="summary-total">
              <span>Tổng thanh toán:</span>
              <span className="total-price">{formatPrice(finalTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
