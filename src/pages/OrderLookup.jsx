import React, { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Search, Ticket, Calendar, Clock, MapPin, CheckCircle, AlertCircle, Printer, ArrowRight, UserCheck } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { lookupGuestBooking } from "../lib/api";
import "./OrderLookup.css";

const OrderLookup = () => {
  const [searchParams] = useSearchParams();
  const [bookingCode, setBookingCode] = useState(searchParams.get("code") || "");
  const [contact, setContact] = useState(searchParams.get("contact") || "");
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const codeParam = searchParams.get("code");
    const contactParam = searchParams.get("contact");
    if (codeParam && contactParam) {
      handleLookup(codeParam, contactParam);
    }
  }, [searchParams]);

  const handleLookup = async (codeToUse, contactToUse) => {
    const c = (codeToUse || bookingCode).trim();
    const ct = (contactToUse || contact).trim();
    if (!c || !ct) {
      setError("Vui lòng nhập đầy đủ Mã đặt vé và Số điện thoại hoặc Email");
      return;
    }
    setLoading(true);
    setError("");
    setBooking(null);
    try {
      const data = await lookupGuestBooking(c, ct);
      setBooking(data);
    } catch (err) {
      setError(err.message || "Không tìm thấy thông tin vé phù hợp. Vui lòng kiểm tra lại.");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = (e) => {
    e.preventDefault();
    handleLookup();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(price || 0);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "paid":
      case "confirmed":
        return <span className="badge badge-success"><CheckCircle size={14} /> Đã thanh toán</span>;
      case "pending":
      case "held":
        return <span className="badge badge-warning"><Clock size={14} /> Chờ thanh toán tại quầy</span>;
      case "used":
        return <span className="badge badge-info">Đã sử dụng</span>;
      case "cancelled":
        return <span className="badge badge-danger">Đã hủy</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div className="lookup-page container animate-fade-in">
      <div className="lookup-hero">
        <span className="lookup-kicker">DÀNH CHO KHÁCH HÀNG</span>
        <h1>Tra Cứu Vé & Đơn Hàng</h1>
        <p>
          Bạn đặt vé không cần tài khoản? Nhập <strong>Mã vé</strong> và <strong>Email hoặc Số điện thoại</strong> đã đăng ký để kiểm tra trạng thái vé và lấy mã QR vào rạp.
        </p>
      </div>

      <div className="lookup-card">
        <form onSubmit={onSubmit} className="lookup-form">
          <div className="lookup-input-group">
            <label htmlFor="bookingCode">Mã đặt vé</label>
            <div className="input-with-icon">
              <Ticket size={18} className="input-icon" />
              <input
                id="bookingCode"
                type="text"
                placeholder="Ví dụ: CV1A2B3C..."
                value={bookingCode}
                onChange={(e) => setBookingCode(e.target.value.toUpperCase())}
                required
              />
            </div>
          </div>

          <div className="lookup-input-group">
            <label htmlFor="contact">Email hoặc Số điện thoại</label>
            <div className="input-with-icon">
              <Search size={18} className="input-icon" />
              <input
                id="contact"
                type="text"
                placeholder="Email hoặc SĐT lúc đặt vé..."
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn btn-primary lookup-submit-btn" disabled={loading}>
            {loading ? "Đang tra cứu..." : "Tra Cứu Ngay"}
          </button>
        </form>

        {error && (
          <div className="lookup-alert lookup-alert-error" role="alert">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
      </div>

      {booking && (
        <div className="lookup-result animate-fade-in">
          <div className="result-header">
            <div>
              <span className="result-kicker">KẾT QUẢ TRA CỨU</span>
              <h2>Mã vé: #{booking.bookingCode}</h2>
            </div>
            <div className="result-status">
              {getStatusBadge(booking.status)}
            </div>
          </div>

          <div className="ticket-display-card">
            <div className="ticket-display-left">
              <h3 className="ticket-movie-title">{booking.movieTitle || "Vé Xem Phim"}</h3>
              
              <div className="ticket-info-grid">
                <div className="ticket-info-item">
                  <Calendar size={18} />
                  <div>
                    <small>Ngày chiếu</small>
                    <strong>{booking.showDate ? new Date(booking.showDate).toLocaleDateString("vi-VN") : "Hôm nay"}</strong>
                  </div>
                </div>

                <div className="ticket-info-item">
                  <Clock size={18} />
                  <div>
                    <small>Suất chiếu</small>
                    <strong>{booking.showTime || "Theo lịch chiếu"}</strong>
                  </div>
                </div>

                <div className="ticket-info-item">
                  <MapPin size={18} />
                  <div>
                    <small>Rạp chiếu</small>
                    <strong>CineVite Landmark (Phòng chiếu 01)</strong>
                  </div>
                </div>

                <div className="ticket-info-item">
                  <Ticket size={18} />
                  <div>
                    <small>Ghế đã đặt</small>
                    <strong>{(booking.clientSeatLabels || []).join(", ") || "Chưa xác định"}</strong>
                  </div>
                </div>
              </div>

              <div className="ticket-customer-section">
                <h4>Thông tin người đặt:</h4>
                <p><strong>Họ tên:</strong> {booking.customerName || "Khách vãng lai"}</p>
                {booking.customerEmail && <p><strong>Email:</strong> {booking.customerEmail}</p>}
                {booking.customerPhone && <p><strong>Số điện thoại:</strong> {booking.customerPhone}</p>}
                <p><strong>Hình thức thanh toán:</strong> {booking.paymentMethod === "cash" ? "Thanh toán tại quầy" : booking.paymentMethod?.toUpperCase()}</p>
                <p><strong>Tổng tiền:</strong> <span className="price-tag">{formatPrice(booking.finalAmount || booking.totalAmount)}</span></p>
              </div>
            </div>

            <div className="ticket-display-right">
              <div className="qr-wrapper">
                <QRCodeSVG value={`https://cinevite.local/ticket/${booking.bookingCode}`} size={140} />
                <p>Quét mã QR tại rạp để vào xem</p>
              </div>

              <button className="btn btn-secondary btn-full print-btn" onClick={() => window.print()}>
                <Printer size={16} /> In / Tải vé điện tử
              </button>

              {!booking.user && (
                <div className="guest-claim-hint">
                  <small>
                    Vé này được đặt dưới dạng <strong>Khách vãng lai</strong>. Bạn có thể tạo tài khoản để quản lý toàn bộ vé đã đặt!
                  </small>
                  <Link to={`/auth?email=${encodeURIComponent(booking.customerEmail || "")}`} className="claim-link">
                    Đăng ký tài khoản ngay <ArrowRight size={14} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderLookup;
