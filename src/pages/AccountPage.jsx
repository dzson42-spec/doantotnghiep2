import React, { useEffect, useState } from "react";
import {
  CalendarDays,
  Film,
  LogOut,
  Mail,
  ShieldCheck,
  UserRound,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiRequest, logout } from "../lib/api";
import "./AccountPage.css";

const AccountPage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser"));
    } catch {
      return null;
    }
  });
  const [profile, setProfile] = useState({
    name: user?.name || "",
    phone: user?.phone || "",
    address: user?.address || "",
  });
  const [bookings, setBookings] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const historyKey = user.email || "guest";
    const localHistory = JSON.parse(
      localStorage.getItem(`booking_history_${historyKey}`) || "[]",
    );
    apiRequest("/bookings/my?limit=20")
      .then((data) => {
        const combined = [...(data.items || []), ...localHistory];
        setBookings([
          ...new Map(
            combined.map((item) => [item.bookingCode || item._id, item]),
          ).values(),
        ]);
      })
      .catch(() => setBookings(localHistory));
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  const cancelBooking = (booking) => {
    if (!window.confirm(`Hủy vé ${booking.bookingCode}?`)) return;
    const historyKey = user.email || "guest";
    const history = JSON.parse(
      localStorage.getItem(`booking_history_${historyKey}`) || "[]",
    );
    const updatedHistory = history.map((item) =>
      item._id === booking._id ? { ...item, status: "cancelled" } : item,
    );
    localStorage.setItem(
      `booking_history_${historyKey}`,
      JSON.stringify(updatedHistory),
    );
    if (booking.showtimeId) {
      const seats = JSON.parse(
        localStorage.getItem(`seats_${booking.showtimeId}`) || "[]",
      );
      const bookedIds = (booking.seats || []).map((seat) => seat.id);
      localStorage.setItem(
        `seats_${booking.showtimeId}`,
        JSON.stringify(
          seats.map((seat) =>
            bookedIds.includes(seat.id)
              ? { ...seat, status: "available" }
              : seat,
          ),
        ),
      );
    }
    setBookings((current) =>
      current.map((item) =>
        item._id === booking._id ? { ...item, status: "cancelled" } : item,
      ),
    );
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setMessage("");
    setError("");
    try {
      const data = await apiRequest("/auth/profile", {
        method: "PATCH",
        body: JSON.stringify(profile),
      });
      setUser(data.user);
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      setMessage("Đã cập nhật hồ sơ");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleLogout = async () => {
    await logout();
    localStorage.removeItem("currentUser");
    window.dispatchEvent(new Event("authChange"));
    navigate("/");
  };

  return (
    <div className="account-page container animate-fade-in">
      <div className="account-hero">
        <div className="account-avatar">
          <UserRound size={38} />
        </div>
        <div>
          <span className="account-kicker">
            {["admin", "superadmin"].includes(user.role)
              ? "TÀI KHOẢN QUẢN TRỊ VIÊN"
              : "TÀI KHOẢN KHÁCH HÀNG"}
          </span>
          <h1>Xin chào, {user.name}</h1>
          <p>
            {["admin", "superadmin"].includes(user.role)
              ? "Bạn có toàn quyền quản trị và điều phối mọi hoạt động trên CineVite."
              : "Quản lý thông tin và trải nghiệm đặt vé CineVite của bạn."}
          </p>
        </div>
      </div>
      <div className="account-grid">
        <section className="account-panel">
          <h2>
            <UserRound size={20} /> Thông tin tài khoản
          </h2>
          <div className="account-detail">
            <Mail size={18} />
            <span>
              <small>Email</small>
              {user.email}
            </span>
          </div>
          <div className="account-detail">
            <ShieldCheck size={18} />
            <span>
              <small>Loại tài khoản</small>
              {["admin", "superadmin"].includes(user.role)
                ? "Quản trị viên (Super Admin)"
                : "Khách hàng"}
            </span>
          </div>
          <form className="account-form" onSubmit={saveProfile}>
            <label>
              Họ tên
              <input
                value={profile.name}
                onChange={(event) =>
                  setProfile({ ...profile, name: event.target.value })
                }
                required
              />
            </label>
            <label>
              Số điện thoại
              <input
                value={profile.phone}
                onChange={(event) =>
                  setProfile({ ...profile, phone: event.target.value })
                }
              />
            </label>
            <label>
              Địa chỉ liên hệ
              <input
                value={profile.address}
                onChange={(event) =>
                  setProfile({ ...profile, address: event.target.value })
                }
              />
            </label>
            <button className="btn btn-primary" type="submit">
              Lưu hồ sơ
            </button>
          </form>
        </section>
        <section className="account-panel account-actions-panel">
          {["admin", "superadmin"].includes(user.role) ? (
            <>
              <ShieldCheck size={40} style={{ color: "#f43f5e", marginBottom: "8px" }} />
              <h2>Quản Trị Hệ Thống</h2>
              <p>Quản lý phim, rạp, suất chiếu, đơn đặt vé, F&B và cài đặt toàn diện.</p>
              <button
                className="btn btn-primary"
                style={{
                  background: "linear-gradient(135deg, #e11d48, #be123c)",
                  marginBottom: "12px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
                onClick={() => navigate("/admin")}
              >
                <ShieldCheck size={18} /> Mở Bảng Quản Trị Admin
              </button>
            </>
          ) : (
            <>
              <Film size={34} className="account-film-icon" />
              <h2>Đặt vé ngay</h2>
              <p>Khám phá phim mới và chọn suất chiếu phù hợp.</p>
              <button
                className="btn btn-primary"
                onClick={() => navigate("/movies")}
              >
                Xem danh sách phim
              </button>
            </>
          )}
          <button className="account-logout" onClick={handleLogout}>
            <LogOut size={17} /> Đăng xuất
          </button>
        </section>
      </div>
      {(message || error) && (
        <div className={error ? "account-alert error" : "account-alert"}>
          {error || message}
        </div>
      )}
      <div className="account-grid account-lower-grid">
        <section className="account-panel">
          <h2>
            <CalendarDays size={20} /> Lịch sử đặt vé
          </h2>
          <div className="booking-history">
            {bookings.length === 0 ? (
              <p>Chưa có đơn đặt vé.</p>
            ) : (
              bookings.map((booking) => (
                <div className="booking-history-row" key={booking._id}>
                  <span>
                    <strong>#{booking.bookingCode}</strong>
                    <small>
                      {booking.movie?.title ||
                        booking.showtime?.movie?.title ||
                        "Vé xem phim"}{" "}
                      ·{" "}
                      {booking.date
                        ? `${booking.time} - ${new Date(booking.date).toLocaleDateString("vi-VN")}`
                        : ""}
                    </small>
                  </span>
                  <span className="booking-history-actions">
                    <b>
                      {booking.status} ·{" "}
                      {(booking.finalAmount || 0).toLocaleString("vi-VN")} đ
                    </b>
                    {booking.status !== "cancelled" && (
                      <button
                        className="booking-cancel-btn"
                        onClick={() => cancelBooking(booking)}
                      >
                        Hủy vé
                      </button>
                    )}
                  </span>
                </div>
              ))
            )}
          </div>
          <button
            className="btn btn-secondary booking-more-btn"
            onClick={() => navigate("/movies")}
          >
            Đặt vé khác
          </button>
        </section>
      </div>
    </div>
  );
};

export default AccountPage;
