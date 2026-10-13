import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  BarChart3,
  Calendar,
  CalendarDays,
  Film,
  LogOut,
  MapPin,
  Plus,
  RefreshCw,
  Settings,
  ShieldCheck,
  Sparkles,
  Ticket,
  Trash2,
  Users,
  Search,
  Download,
  CheckCircle,
  Clock,
  XCircle,
  Coffee,
  Tag,
  Star,
  Layers,
  FileText,
  Printer,
  X,
  CreditCard,
  Edit,
  Eye,
  Sliders,
  AlertTriangle,
} from "lucide-react";
import { adminApiRequest as apiRequest, adminLogin as login, adminLogout as logout } from "../lib/api";
import {
  getStoredMovies,
  saveStoredMovies,
  getStoredShowtimes,
  saveStoredShowtimes,
} from "../data/mockData";
import "./AdminApp.css";

const emptyMovie = {
  title: "",
  duration: "",
  genre: "Hành động, Phiêu lưu",
  synopsis: "",
  ageRating: "P",
  language: "Tiếng Việt",
  status: "showing",
  poster: "",
  backdrop: "",
  trailerUrl: "",
  cast: "",
};

const emptyCombo = {
  name: "",
  description: "",
  price: "",
  originalPrice: "",
  image: "",
};

const emptyPromo = {
  code: "",
  name: "",
  type: "percentage",
  value: "",
  minOrderAmount: "0",
  maxDiscount: "",
  usageLimit: "100",
};

const emptyPos = {
  movieTitle: "",
  showDate: new Date().toISOString().split("T")[0],
  showTime: "19:00",
  seats: "A1, A2",
  totalAmount: "160000",
  customerName: "Khách mua tại quầy",
  customerPhone: "",
  customerEmail: "",
  paymentMethod: "cash",
  isPaid: true,
};

// Helper: Export data to CSV
const exportToCSV = (filename, rows, headers) => {
  const csvContent =
    "data:text/csv;charset=utf-8,\uFEFF" +
    [
      headers.join(","),
      ...rows.map((row) =>
        row
          .map((cell) => `"${String(cell ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const AdminLogin = ({ onLogin }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const submit = async (event) => {
    event.preventDefault();
    setError("");
    try {
      const user = await login(email, password);
      if (!["admin", "superadmin"].includes(user.role))
        throw new Error("Tài khoản không có quyền quản trị");
      onLogin(user);
    } catch (err) {
      localStorage.removeItem("cinevite_admin_access_token");
      setError(err.message);
    }
  };
  return (
    <div className="admin-login">
      <form className="admin-login-card" onSubmit={submit}>
        <div className="admin-brand">
          <Film /> CineVite Admin
        </div>
        <h1>Đăng nhập quản trị</h1>
        <p>Hệ thống Quản lý phim, rạp, đơn vé, F&B và cấu hình toàn diện.</p>
        {error && <div className="admin-error">{error}</div>}
        <label>
          Email / Tài khoản
          <input
            type="text"
            placeholder="thiensonadmin@gmail.com"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Mật khẩu
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button className="btn btn-primary" type="submit">
          Đăng nhập
        </button>
      </form>
    </div>
  );
};

const AdminApp = () => {
  const [user, setUser] = useState(null);
  const [section, setSection] = useState("dashboard");
  
  // Data lists
  const [movies, setMovies] = useState([]);
  const [theaters, setTheaters] = useState([]);
  const [auditoriums, setAuditoriums] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [combos, setCombos] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [banners, setBanners] = useState([]);
  const [settings, setSettings] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [topMovies, setTopMovies] = useState([]);
  const [revenueReport, setRevenueReport] = useState(null);
  const [summary, setSummary] = useState(null);

  // Forms & Edit States
  const [movieForm, setMovieForm] = useState(emptyMovie);
  const [editingMovieId, setEditingMovieId] = useState(null);
  const [showtimeModalMovie, setShowtimeModalMovie] = useState(null);
  const [showtimeForm, setShowtimeForm] = useState({
    date: new Date().toISOString().split("T")[0],
    time: "19:00",
    theaterId: "",
    auditoriumId: "",
    format: "2D",
    price: 80000,
  });

  const [comboForm, setComboForm] = useState(emptyCombo);
  const [promoForm, setPromoForm] = useState(emptyPromo);
  const [posForm, setPosForm] = useState(emptyPos);
  const [isPosOpen, setIsPosOpen] = useState(false);
  const [bannerForm, setBannerForm] = useState({ title: "", image: "", link: "", isActive: true });

  // Filters & Search
  const [movieSearch, setMovieSearch] = useState("");
  const [movieStatusFilter, setMovieStatusFilter] = useState("all");
  const [bookingSearch, setBookingSearch] = useState("");
  const [bookingFilter, setBookingFilter] = useState("all");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [
        movieData,
        theaterData,
        showtimeData,
        auditoriumData,
        dashboard,
        bookingData,
        userData,
        comboData,
        promoData,
        reviewData,
        bannerData,
        settingData,
        auditData,
        topMoviesData,
        revenueReportData,
      ] = await Promise.all([
        apiRequest("/movies?limit=100").catch(() => null),
        apiRequest("/theaters").catch(() => []),
        apiRequest("/showtimes").catch(() => []),
        apiRequest("/admin/auditoriums").catch(() => []),
        apiRequest("/admin/dashboard/summary").catch(() => null),
        apiRequest("/bookings/admin?limit=100").catch(() => ({ items: [] })),
        apiRequest("/admin/users?limit=100").catch(() => ({ items: [] })),
        apiRequest("/admin/combos").catch(() => []),
        apiRequest("/admin/promotions").catch(() => []),
        apiRequest("/admin/reviews").catch(() => []),
        apiRequest("/admin/cms/banners").catch(() => []),
        apiRequest("/admin/settings").catch(() => []),
        apiRequest("/admin/audit-logs").catch(() => []),
        apiRequest("/admin/reports/top-movies").catch(() => []),
        apiRequest("/admin/reports/revenue").catch(() => null),
      ]);

      const loadedMovies = movieData?.items?.length > 0 ? movieData.items : getStoredMovies();
      setMovies(loadedMovies);
      saveStoredMovies(loadedMovies);

      const loadedTheaters = theaterData?.length > 0 ? theaterData : [
        { _id: "T1", id: 1, name: "CineVite Landmark 81", address: "Tầng B1, Landmark 81, TP.HCM" },
        { _id: "T2", id: 2, name: "CineVite Crescent Mall", address: "Tầng 3, Crescent Mall, Quận 7, TP.HCM" },
        { _id: "T3", id: 3, name: "CineVite Vincom Gò Vấp", address: "Vincom Plaza Gò Vấp, TP.HCM" },
      ];
      setTheaters(loadedTheaters);

      const loadedAuditoriums = auditoriumData?.length > 0 ? auditoriumData : [
        { _id: "A1", name: "Phòng Chiếu 01 (IMAX)", type: "imax" },
        { _id: "A2", name: "Phòng Chiếu 02 (Standard)", type: "standard" },
      ];
      setAuditoriums(loadedAuditoriums);

      setShowtimes(showtimeData || []);
      setSummary(dashboard);
      setBookings(bookingData?.items || []);
      setUsers(userData?.items || []);
      setCombos(comboData || []);
      setPromotions(promoData || []);
      setReviews(reviewData || []);
      setBanners(bannerData || []);
      setSettings(settingData || []);
      setAuditLogs(auditData || []);
      setTopMovies(topMoviesData || []);
      setRevenueReport(revenueReportData);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let token = localStorage.getItem("cinevite_admin_access_token");
    if (!token) {
      token = localStorage.getItem("cinevite_access_token");
      if (token) {
        localStorage.setItem("cinevite_admin_access_token", token);
      }
    }
    if (!token) return;
    apiRequest("/auth/me")
      .then(({ user: currentUser }) => {
        if (["admin", "superadmin"].includes(currentUser.role))
          setUser(currentUser);
      })
      .catch(() => localStorage.removeItem("cinevite_admin_access_token"));
  }, []);

  // Polling every 10s for real-time order and revenue updates
  useEffect(() => {
    if (user) {
      loadData();
      const interval = setInterval(() => loadData(true), 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  if (!user) return <AdminLogin onLogin={setUser} />;

  // ==========================================
  // HANDLERS
  // ==========================================
  
  // 1. Movie & Showtime CRUD
  const handleSaveMovie = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const payload = {
        ...movieForm,
        duration: Number(String(movieForm.duration).replace(/\D/g, "")) || 120,
        cast: typeof movieForm.cast === "string" ? movieForm.cast.split(",").map((s) => s.trim()).filter(Boolean) : movieForm.cast,
        genre: typeof movieForm.genre === "string" ? movieForm.genre.split(",").map((s) => s.trim()).filter(Boolean) : movieForm.genre,
      };

      if (editingMovieId) {
        // Cập nhật phim
        let updated = null;
        try {
          updated = await apiRequest(`/admin/movies/${editingMovieId}`, {
            method: "PATCH",
            body: JSON.stringify(payload),
          });
        } catch {
          // fallback
        }
        const updatedList = movies.map((m) =>
          String(m._id || m.id) === String(editingMovieId)
            ? { ...m, ...payload, ...(updated || {}) }
            : m
        );
        setMovies(updatedList);
        saveStoredMovies(updatedList);
        setMessage("Đã cập nhật thông tin phim thành công!");
        setEditingMovieId(null);
        setMovieForm(emptyMovie);
      } else {
        // Thêm phim mới
        let created = null;
        try {
          created = await apiRequest("/admin/movies", {
            method: "POST",
            body: JSON.stringify(payload),
          });
        } catch {
          // fallback
        }
        const newMovie = created || {
          ...payload,
          id: Date.now(),
          _id: "m_" + Date.now(),
          rating: "8.5/10",
        };
        const updatedList = [newMovie, ...movies];
        setMovies(updatedList);
        saveStoredMovies(updatedList);

        // Tự động tạo lịch chiếu mẫu 7 ngày cho phim mới
        const allSt = getStoredShowtimes();
        const mKey = newMovie.id || newMovie._id;
        if (!allSt[mKey]) {
          const today = new Date();
          const dates = Array.from({ length: 7 }, (_, i) => {
            const d = new Date(today);
            d.setDate(today.getDate() + i);
            return d.toISOString().split("T")[0];
          });
          allSt[mKey] = dates.map((date, di) => ({
            date,
            times: ["09:30", "13:00", "16:30", "19:45", "22:15"].map((time, ti) => ({
              time,
              showtimeId: `M${mKey}-D${di + 1}-T${ti + 1}`,
            })),
          }));
          saveStoredShowtimes(allSt);
        }

        setMessage("Đã thêm phim mới và tạo lịch chiếu thành công!");
        setMovieForm(emptyMovie);
      }
      await loadData(true);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleEditMovie = (movie) => {
    setEditingMovieId(movie._id || movie.id);
    setMovieForm({
      title: movie.title || "",
      duration: String(movie.duration || "").replace(/\D/g, ""),
      genre: Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre || "",
      synopsis: movie.synopsis || "",
      ageRating: movie.ageRating || "P",
      language: movie.language || "Tiếng Việt",
      status: movie.status || "showing",
      poster: movie.poster || "",
      backdrop: movie.backdrop || "",
      trailerUrl: movie.trailerUrl || "",
      cast: Array.isArray(movie.cast) ? movie.cast.join(", ") : movie.cast || "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCancelEdit = () => {
    setEditingMovieId(null);
    setMovieForm(emptyMovie);
  };

  const deleteMovie = async (id) => {
    const movieToDelete = movies.find((m) => String(m._id || m.id) === String(id));
    if (!window.confirm(`Bạn có chắc chắn muốn xóa phim "${movieToDelete?.title || id}"?`)) return;
    try {
      try {
        await apiRequest(`/admin/movies/${id}`, { method: "DELETE" });
      } catch {
        // fallback
      }
      const updatedList = movies.filter((m) => String(m._id || m.id) !== String(id));
      setMovies(updatedList);
      saveStoredMovies(updatedList);
      setMessage("Đã xóa phim thành công");
      await loadData(true);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleOpenShowtimeModal = (movie) => {
    setShowtimeModalMovie(movie);
    setShowtimeForm({
      date: new Date().toISOString().split("T")[0],
      time: "19:00",
      theaterId: theaters[0]?._id || theaters[0]?.id || "",
      auditoriumId: auditoriums[0]?._id || "",
      format: (Array.isArray(movie.format) ? movie.format[0] : movie.format) || "2D",
      price: 80000,
    });
  };

  const handleCloseShowtimeModal = () => {
    setShowtimeModalMovie(null);
  };

  const handleAddShowtime = async (e) => {
    e.preventDefault();
    if (!showtimeModalMovie) return;
    try {
      const [hours, minutes] = showtimeForm.time.split(":").map(Number);
      const start = new Date(showtimeForm.date);
      start.setHours(hours, minutes, 0, 0);
      const dur = Number(String(showtimeModalMovie.duration).replace(/\D/g, "")) || 120;
      const end = new Date(start.getTime() + dur * 60000);

      if (showtimeForm.theaterId && showtimeForm.auditoriumId) {
        try {
          await apiRequest("/admin/showtimes", {
            method: "POST",
            body: JSON.stringify({
              movie: showtimeModalMovie._id || showtimeModalMovie.id,
              theater: showtimeForm.theaterId,
              auditorium: showtimeForm.auditoriumId,
              startTime: start,
              endTime: end,
              format: showtimeForm.format,
              price: { standard: Number(showtimeForm.price), vip: Number(showtimeForm.price) * 1.5 },
            }),
          });
        } catch {
          // ignore
        }
      }

      const mKey = showtimeModalMovie.id || showtimeModalMovie._id;
      const allSt = getStoredShowtimes();
      const movieStList = allSt[mKey] || [];
      const dateEntry = movieStList.find((d) => d.date === showtimeForm.date);
      const newTimeItem = {
        time: showtimeForm.time,
        showtimeId: `ST_${Date.now()}`,
        format: showtimeForm.format,
        price: Number(showtimeForm.price),
      };

      if (dateEntry) {
        if (!dateEntry.times.some((t) => t.time === showtimeForm.time)) {
          dateEntry.times.push(newTimeItem);
          dateEntry.times.sort((a, b) => a.time.localeCompare(b.time));
        }
      } else {
        movieStList.push({
          date: showtimeForm.date,
          times: [newTimeItem],
        });
        movieStList.sort((a, b) => a.date.localeCompare(b.date));
      }
      allSt[mKey] = movieStList;
      saveStoredShowtimes(allSt);

      setMessage(`Đã thêm suất chiếu ${showtimeForm.time} ngày ${showtimeForm.date} cho phim "${showtimeModalMovie.title}"`);
      await loadData(true);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleDeleteShowtime = (dateStr, timeStr, stId) => {
    if (!showtimeModalMovie) return;
    if (!window.confirm(`Xóa suất chiếu lúc ${timeStr} ngày ${dateStr}?`)) return;
    try {
      if (stId && !stId.startsWith("M") && !stId.startsWith("ST_")) {
        apiRequest(`/admin/showtimes/${stId}`, { method: "DELETE" }).catch(() => {});
      }
      const mKey = showtimeModalMovie.id || showtimeModalMovie._id;
      const allSt = getStoredShowtimes();
      const movieStList = allSt[mKey] || [];
      const dateEntry = movieStList.find((d) => d.date === dateStr);
      if (dateEntry) {
        dateEntry.times = dateEntry.times.filter((t) => t.time !== timeStr && t.showtimeId !== stId);
        if (dateEntry.times.length === 0) {
          allSt[mKey] = movieStList.filter((d) => d.date !== dateStr);
        }
        saveStoredShowtimes(allSt);
      }
      setMessage(`Đã xóa suất chiếu ${timeStr} ngày ${dateStr}`);
      loadData(true);
    } catch (err) {
      setMessage(err.message);
    }
  };

  const handleAutoGenerateWeekly = () => {
    if (!showtimeModalMovie) return;
    const mKey = showtimeModalMovie.id || showtimeModalMovie._id;
    const allSt = getStoredShowtimes();
    const today = new Date();
    const times = ["09:00", "11:30", "14:15", "16:45", "19:15", "21:45"];
    const dates = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      return d.toISOString().split("T")[0];
    });

    allSt[mKey] = dates.map((date, di) => ({
      date,
      times: times.map((time, ti) => ({
        time,
        showtimeId: `M${mKey}-D${di + 1}-T${ti + 1}`,
      })),
    }));

    saveStoredShowtimes(allSt);
    setMessage(`Đã tạo tự động 42 suất chiếu tuần cho phim "${showtimeModalMovie.title}"`);
    loadData(true);
  };

  // 2. Booking Status Updates & POS
  const updateBookingStatus = async (id, status, reason = "") => {
    try {
      await apiRequest(`/admin/bookings/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, cancelReason: reason }),
      });
      setMessage(`Đã chuyển trạng thái vé sang: ${status.toUpperCase()}`);
      await loadData();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const collectBooking = async (id) => {
    try {
      await apiRequest(`/admin/bookings/${id}/collect`, { method: "PATCH" });
      setMessage("Đã xác nhận thu tiền mặt tại quầy");
      await loadData();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const createPosBooking = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await apiRequest("/admin/bookings/manual", {
        method: "POST",
        body: JSON.stringify(posForm),
      });
      setMessage("Đã tạo vé xem phim tại quầy thành công");
      setIsPosOpen(false);
      setPosForm(emptyPos);
      await loadData();
    } catch (err) {
      setMessage(err.message);
    }
  };

  // 3. Combos CRUD
  const createCombo = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await apiRequest("/admin/combos", {
        method: "POST",
        body: JSON.stringify({
          ...comboForm,
          price: Number(comboForm.price),
          originalPrice: comboForm.originalPrice ? Number(comboForm.originalPrice) : undefined,
        }),
      });
      setComboForm(emptyCombo);
      setMessage("Đã tạo combo bắp nước thành công");
      await loadData();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const deleteCombo = async (id) => {
    if (!window.confirm("Xóa combo này?")) return;
    try {
      await apiRequest(`/admin/combos/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setMessage(err.message);
    }
  };

  // 4. Promotions CRUD
  const createPromotion = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      await apiRequest("/admin/promotions", {
        method: "POST",
        body: JSON.stringify({
          ...promoForm,
          value: Number(promoForm.value),
          minOrderAmount: Number(promoForm.minOrderAmount || 0),
          maxDiscount: promoForm.maxDiscount ? Number(promoForm.maxDiscount) : undefined,
          usageLimit: promoForm.usageLimit ? Number(promoForm.usageLimit) : undefined,
        }),
      });
      setPromoForm(emptyPromo);
      setMessage("Đã tạo mã khuyến mãi thành công");
      await loadData();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const deletePromotion = async (id) => {
    if (!window.confirm("Xóa mã khuyến mãi này?")) return;
    try {
      await apiRequest(`/admin/promotions/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setMessage(err.message);
    }
  };

  // 5. Review Moderation
  const approveReview = async (id, isApproved) => {
    try {
      await apiRequest(`/admin/reviews/${id}/approve`, {
        method: "PATCH",
        body: JSON.stringify({ isApproved }),
      });
      setMessage(isApproved ? "Đã duyệt hiển thị đánh giá" : "Đã ẩn đánh giá");
      await loadData();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const deleteReview = async (id) => {
    if (!window.confirm("Xóa đánh giá này vĩnh viễn?")) return;
    try {
      await apiRequest(`/admin/reviews/${id}`, { method: "DELETE" });
      await loadData();
    } catch (err) {
      setMessage(err.message);
    }
  };

  // 6. User RBAC & Status
  const updateUserStatus = async (id, isActive) => {
    try {
      await apiRequest(`/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ isActive }),
      });
      await loadData();
    } catch (err) {
      setMessage(err.message);
    }
  };

  const updateUserRole = async (id, role) => {
    try {
      await apiRequest(`/admin/users/${id}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      await loadData();
    } catch (err) {
      setMessage(err.message);
    }
  };

  // 7. CMS Banner Management
  const addBanner = async (e) => {
    e.preventDefault();
    const updated = [...banners, { id: Date.now().toString(), ...bannerForm }];
    try {
      await apiRequest("/admin/cms/banners", {
        method: "POST",
        body: JSON.stringify({ banners: updated }),
      });
      setBanners(updated);
      setBannerForm({ title: "", image: "", link: "", isActive: true });
      setMessage("Đã thêm banner trang chủ");
    } catch (err) {
      setMessage(err.message);
    }
  };

  const deleteBanner = async (id) => {
    const updated = banners.filter((b) => b.id !== id);
    try {
      await apiRequest("/admin/cms/banners", {
        method: "POST",
        body: JSON.stringify({ banners: updated }),
      });
      setBanners(updated);
      setMessage("Đã xóa banner");
    } catch (err) {
      setMessage(err.message);
    }
  };

  // 8. Settings Update
  const updateSetting = async (key, value) => {
    try {
      await apiRequest(`/admin/settings/${key}`, {
        method: "PUT",
        body: JSON.stringify({ value }),
      });
      setMessage(`Đã cập nhật cấu hình: ${key}`);
      await loadData();
    } catch (err) {
      setMessage(err.message);
    }
  };

  // ==========================================
  // EXPORT CSV HANDLERS
  // ==========================================
  const handleExportBookings = () => {
    const headers = ["Mã đơn", "Tên phim", "Ngày chiếu", "Suất", "Ghế", "Khách hàng", "SĐT", "Email", "Tổng tiền", "Trạng thái", "Ngày đặt"];
    const rows = bookings.map((b) => [
      b.bookingCode,
      b.movieTitle || b.movie?.title || "",
      b.showDate || "",
      b.showTime || "",
      (b.clientSeatLabels || (b.seats || []).map((s) => s.id)).join(" "),
      b.customerName || b.user?.name || "Khách",
      b.customerPhone || b.user?.phone || "",
      b.customerEmail || b.user?.email || "",
      b.finalAmount || 0,
      b.status,
      new Date(b.createdAt).toLocaleString("vi-VN"),
    ]);
    exportToCSV(`Danh_sach_don_ve_${new Date().toISOString().split("T")[0]}.csv`, rows, headers);
  };

  const handleExportUsers = () => {
    const headers = ["ID", "Họ tên", "Email", "Số điện thoại", "Vai trò", "Trạng thái", "Ngày tham gia"];
    const rows = users.map((u) => [
      u._id,
      u.name,
      u.email,
      u.phone || "",
      u.role,
      u.isActive ? "Hoạt động" : "Đã khóa",
      new Date(u.createdAt).toLocaleDateString("vi-VN"),
    ]);
    exportToCSV(`Danh_sach_khach_hang_${new Date().toISOString().split("T")[0]}.csv`, rows, headers);
  };

  const handleExportRevenue = () => {
    const headers = ["Tên phim", "Doanh thu thực tế (VNĐ)", "Số vé bán ra", "Số đơn đặt"];
    const rows = topMovies.map((m) => [
      m._id || "Khác",
      m.totalRevenue || 0,
      m.ticketCount || 0,
      m.orderCount || 0,
    ]);
    exportToCSV(`Bao_cao_doanh_thu_theo_phim_${new Date().toISOString().split("T")[0]}.csv`, rows, headers);
  };

  // Filtered Bookings
  const filteredBookings = bookings.filter((b) => {
    const matchSearch =
      !bookingSearch ||
      (b.bookingCode && b.bookingCode.toLowerCase().includes(bookingSearch.toLowerCase())) ||
      (b.customerName && b.customerName.toLowerCase().includes(bookingSearch.toLowerCase())) ||
      (b.customerPhone && b.customerPhone.includes(bookingSearch));
    const matchFilter = bookingFilter === "all" || b.status === bookingFilter;
    return matchSearch && matchFilter;
  });

  // Filtered Users
  const filteredUsers = users.filter((u) => {
    const matchSearch =
      !userSearch ||
      (u.name && u.name.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.email && u.email.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.phone && u.phone.includes(userSearch));
    const matchRole = userRoleFilter === "all" || u.role === userRoleFilter;
    return matchSearch && matchRole;
  });

  const navItems = [
    ["dashboard", BarChart3, "Tổng quan & Thống kê"],
    ["bookings", Ticket, "Đơn hàng & POS"],
    ["movies", Film, "Phim & Suất chiếu"],
    ["combos", Coffee, "Combo Bắp Nước"],
    ["marketing", Tag, "Voucher & Khuyến mãi"],
    ["reviews", Star, "Đánh giá & Bình luận"],
    ["users", Users, "Người dùng & Phân quyền"],
    ["cms", Layers, "Nội dung & Banner"],
    ["settings", Settings, "Cấu hình & Nhật ký"],
  ];

  return (
    <div className="admin-shell">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-brand">
          <Film /> CineVite Admin
        </div>
        <nav>
          {navItems.map(([key, Icon, label]) => (
            <button
              key={key}
              className={section === key ? "active" : ""}
              onClick={() => {
                setSection(key);
                setMessage("");
              }}
            >
              <Icon size={18} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <Link
          to="/"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            color: "#94a3b8",
            textDecoration: "none",
            fontSize: "14px",
            borderRadius: "8px",
            margin: "8px 0 4px",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <ArrowLeft size={16} /> <span>Về trang người dùng</span>
        </Link>
        <button
          className="admin-logout"
          onClick={async () => {
            await logout();
            setUser(null);
          }}
        >
          <LogOut size={18} /> <span>Đăng xuất</span>
        </button>
      </aside>

      {/* Main Container */}
      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="admin-kicker">QUẢN TRỊ HỆ THỐNG CINEVITE</span>
            <h1>{navItems.find(([key]) => key === section)?.[2]}</h1>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <Link
              to="/"
              className="btn btn-secondary"
              style={{
                fontSize: "13px",
                padding: "6px 12px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ArrowLeft size={15} /> Trang web khách hàng
            </Link>
            <button className="icon-btn" onClick={() => loadData()} title="Tải lại dữ liệu">
              <RefreshCw size={18} />
            </button>
          </div>
        </header>

        {message && <div className="admin-message animate-fade-in">{message}</div>}
        {loading && <div className="admin-loading">Đang đồng bộ dữ liệu...</div>}

        {/* ==================================================== */}
        {/* 1. DASHBOARD & ANALYTICS                             */}
        {/* ==================================================== */}
        {section === "dashboard" && (
          <section className="admin-content">
            <div className="admin-stats">
              <div>
                <span>Vai trò của bạn</span>
                <strong>{summary?.role || user.role}</strong>
              </div>
              <div>
                <span>Doanh thu thực thu</span>
                <strong style={{ color: "#4ade80" }}>
                  {(revenueReport?.actual?.total || summary?.revenue || 0).toLocaleString("vi-VN")} đ
                </strong>
                <small>{revenueReport?.actual?.orders || 0} đơn đã thanh toán</small>
              </div>
              <div>
                <span>Doanh thu dự kiến</span>
                <strong style={{ color: "#fde047" }}>
                  {(revenueReport?.expected?.total || 0).toLocaleString("vi-VN")} đ
                </strong>
                <small>{revenueReport?.expected?.orders || 0} tổng đơn đặt</small>
              </div>
              <div>
                <span>Khách mới (30 ngày)</span>
                <strong>{summary?.newUsers || 0}</strong>
              </div>
            </div>

            <div className="admin-toolbar">
              <div className="admin-toolbar-left">
                <strong>Thống kê hiệu suất kinh doanh</strong>
              </div>
              <div className="admin-toolbar-right">
                <button className="btn-csv" onClick={handleExportRevenue}>
                  <Download size={16} /> Xuất Báo Cáo Doanh Thu (CSV)
                </button>
              </div>
            </div>

            <div className="admin-panel" style={{ marginBottom: "1.5rem" }}>
              <h2>
                <BarChart3 size={20} /> Top Phim Bán Chạy Nhất
              </h2>
              {topMovies.length === 0 ? (
                <p>Chưa có dữ liệu thống kê phim.</p>
              ) : (
                <div>
                  {topMovies.map((movie, index) => (
                    <div key={index} className="top-movie-item">
                      <div className="top-movie-rank">#{index + 1}</div>
                      <div className="top-movie-info">
                        <strong>{movie._id || "Vé chưa định danh"}</strong>
                        <small>{movie.ticketCount} vé đã bán · {movie.orderCount} đơn hàng</small>
                      </div>
                      <div className="top-movie-revenue">
                        {(movie.totalRevenue || 0).toLocaleString("vi-VN")} đ
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>
        )}

        {/* ==================================================== */}
        {/* 2. ORDER MANAGEMENT & POS                            */}
        {/* ==================================================== */}
        {section === "bookings" && (
          <section className="admin-content">
            <div className="admin-toolbar">
              <div className="admin-toolbar-left">
                <input
                  type="text"
                  placeholder="Tìm mã đơn, tên, SĐT..."
                  className="admin-search-input"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                />
                <select
                  className="admin-filter-select"
                  value={bookingFilter}
                  onChange={(e) => setBookingFilter(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái</option>
                  <option value="pending">Chờ thu tiền (Pending)</option>
                  <option value="paid">Đã thanh toán (Paid)</option>
                  <option value="used">Đã soát vé (Used)</option>
                  <option value="cancelled">Đã hủy (Cancelled)</option>
                </select>
              </div>
              <div className="admin-toolbar-right">
                <button className="btn-pos" onClick={() => setIsPosOpen(true)}>
                  <Plus size={16} /> Đặt vé tại quầy (POS)
                </button>
                <button className="btn-csv" onClick={handleExportBookings}>
                  <Download size={16} /> Xuất DS Đơn (CSV)
                </button>
              </div>
            </div>

            <div className="admin-panel">
              <h2>Đơn đặt vé ({filteredBookings.length})</h2>
              <div className="admin-table">
                {filteredBookings.map((b) => (
                  <div className="admin-row" key={b._id}>
                    <div>
                      <strong>#{b.bookingCode} · {b.movieTitle || b.movie?.title || "Vé xem phim"}</strong>
                      <small>
                        {b.customerName || b.user?.name || "Khách"} ({b.customerPhone || b.user?.phone || "Không có SĐT"}) ·{" "}
                        Ghế: {(b.clientSeatLabels || (b.seats || []).map((s) => s.id)).join(", ") || "Chưa chọn"} ·{" "}
                        {new Date(b.createdAt).toLocaleString("vi-VN")}
                      </small>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <span className={`admin-badge ${b.status}`}>{b.status}</span>
                      <strong style={{ minWidth: "90px", textAlign: "right" }}>
                        {(b.finalAmount || 0).toLocaleString("vi-VN")} đ
                      </strong>

                      {b.status === "pending" && (
                        <button className="btn-action-sm btn-action-collect" onClick={() => collectBooking(b._id)}>
                          Thu tiền
                        </button>
                      )}
                      {b.status === "paid" && (
                        <button className="btn-action-sm btn-action-checkin" onClick={() => updateBookingStatus(b._id, "used")}>
                          Soát vé
                        </button>
                      )}
                      {["pending", "paid"].includes(b.status) && (
                        <button
                          className="btn-action-sm btn-action-cancel"
                          onClick={() => {
                            const reason = window.prompt("Lý do hủy đơn vé:", "Khách yêu cầu hủy");
                            if (reason !== null) updateBookingStatus(b._id, "cancelled", reason);
                          }}
                        >
                          Hủy vé
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {filteredBookings.length === 0 && <p>Không có đơn đặt vé nào phù hợp.</p>}
              </div>
            </div>

            {/* Modal: POS Ticket Booking */}
            {isPosOpen && (
              <div className="admin-modal-overlay">
                <div className="admin-modal-card animate-fade-in">
                  <div className="admin-modal-header">
                    <h3>
                      <Ticket size={20} /> Đặt vé nhanh tại quầy (POS)
                    </h3>
                    <button className="admin-modal-close" onClick={() => setIsPosOpen(false)}>
                      <X size={20} />
                    </button>
                  </div>
                  <form className="admin-form" onSubmit={createPosBooking}>
                    <label>
                      Tên phim
                      <input
                        type="text"
                        required
                        placeholder="Ví dụ: Dune 2, Mai, Conan..."
                        value={posForm.movieTitle}
                        onChange={(e) => setPosForm({ ...posForm, movieTitle: e.target.value })}
                      />
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                      <label>
                        Ngày chiếu
                        <input
                          type="date"
                          required
                          value={posForm.showDate}
                          onChange={(e) => setPosForm({ ...posForm, showDate: e.target.value })}
                        />
                      </label>
                      <label>
                        Giờ chiếu
                        <input
                          type="text"
                          required
                          placeholder="19:30"
                          value={posForm.showTime}
                          onChange={(e) => setPosForm({ ...posForm, showTime: e.target.value })}
                        />
                      </label>
                    </div>
                    <label>
                      Danh sách ghế (cách nhau bằng dấu phẩy)
                      <input
                        type="text"
                        required
                        placeholder="F5, F6..."
                        value={posForm.seats}
                        onChange={(e) => setPosForm({ ...posForm, seats: e.target.value })}
                      />
                    </label>
                    <label>
                      Tổng số tiền thu (VNĐ)
                      <input
                        type="number"
                        required
                        value={posForm.totalAmount}
                        onChange={(e) => setPosForm({ ...posForm, totalAmount: e.target.value })}
                      />
                    </label>
                    <label>
                      Tên khách hàng
                      <input
                        type="text"
                        value={posForm.customerName}
                        onChange={(e) => setPosForm({ ...posForm, customerName: e.target.value })}
                      />
                    </label>
                    <label>
                      Số điện thoại khách (tùy chọn)
                      <input
                        type="tel"
                        value={posForm.customerPhone}
                        onChange={(e) => setPosForm({ ...posForm, customerPhone: e.target.value })}
                      />
                    </label>
                    <label>
                      Phương thức thanh toán
                      <select
                        value={posForm.paymentMethod}
                        onChange={(e) => setPosForm({ ...posForm, paymentMethod: e.target.value })}
                      >
                        <option value="cash">Tiền mặt tại quầy</option>
                        <option value="momo">MoMo QR</option>
                        <option value="zalopay">ZaloPay QR</option>
                        <option value="card">Thẻ POS</option>
                      </select>
                    </label>
                    <button className="btn btn-primary" type="submit" style={{ marginTop: "1rem" }}>
                      Xác nhận in vé & Lưu đơn
                    </button>
                  </form>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ==================================================== */}
        {/* 3. MOVIES & SHOWTIMES                                */}
        {/* ==================================================== */}
        {section === "movies" && (
          <section className="admin-content">
            <div className="admin-toolbar" style={{ marginBottom: "1.25rem" }}>
              <div className="admin-toolbar-left" style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", alignItems: "center" }}>
                <input
                  type="text"
                  placeholder="Tìm phim theo tên..."
                  className="admin-search-input"
                  style={{ width: "260px" }}
                  value={movieSearch}
                  onChange={(e) => setMovieSearch(e.target.value)}
                />
                <select
                  className="admin-filter-select"
                  value={movieStatusFilter}
                  onChange={(e) => setMovieStatusFilter(e.target.value)}
                >
                  <option value="all">Tất cả trạng thái ({movies.length})</option>
                  <option value="showing">Đang chiếu (Showing)</option>
                  <option value="upcoming">Sắp chiếu (Upcoming)</option>
                  <option value="ended">Đã kết thúc (Ended)</option>
                  <option value="draft">Bản nháp (Draft)</option>
                </select>
              </div>
              <div className="admin-toolbar-right">
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setEditingMovieId(null);
                    setMovieForm(emptyMovie);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                >
                  <Plus size={16} /> Thêm phim mới
                </button>
              </div>
            </div>

            <div className="admin-two-col">
              {/* Form Thêm / Sửa Phim */}
              <form className="admin-panel admin-form" onSubmit={handleSaveMovie}>
                <h2>
                  {editingMovieId ? (
                    <>
                      <Edit size={20} style={{ color: "#f59e0b" }} /> Chỉnh sửa phim
                    </>
                  ) : (
                    <>
                      <Plus size={20} /> Thêm phim mới
                    </>
                  )}
                </h2>

                {editingMovieId && (
                  <div style={{ background: "rgba(245, 158, 11, 0.12)", border: "1px solid rgba(245, 158, 11, 0.3)", borderRadius: "6px", padding: "8px 12px", marginBottom: "12px", fontSize: "0.85rem", color: "#fcd34d" }}>
                    Đang chỉnh sửa: <strong>{movieForm.title}</strong>
                  </div>
                )}

                <label>
                  Tên phim *
                  <input
                    required
                    placeholder="Nhập tên phim"
                    value={movieForm.title}
                    onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  />
                </label>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <label>
                    Thời lượng (phút) *
                    <input
                      type="number"
                      required
                      placeholder="120"
                      value={movieForm.duration}
                      onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                    />
                  </label>
                  <label>
                    Độ tuổi
                    <select
                      value={movieForm.ageRating}
                      onChange={(e) => setMovieForm({ ...movieForm, ageRating: e.target.value })}
                    >
                      <option value="P">P - Mọi lứa tuổi</option>
                      <option value="T13">T13 - Khán giả từ 13 tuổi</option>
                      <option value="T16">T16 - Khán giả từ 16 tuổi</option>
                      <option value="T18">T18 - Khán giả từ 18 tuổi</option>
                    </select>
                  </label>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <label>
                    Trạng thái chiếu
                    <select
                      value={movieForm.status}
                      onChange={(e) => setMovieForm({ ...movieForm, status: e.target.value })}
                    >
                      <option value="showing">Đang chiếu (Showing)</option>
                      <option value="upcoming">Sắp chiếu (Upcoming)</option>
                      <option value="ended">Đã kết thúc (Ended)</option>
                      <option value="draft">Bản nháp (Draft)</option>
                    </select>
                  </label>
                  <label>
                    Thể loại
                    <input
                      placeholder="Hành động, Phiêu lưu..."
                      value={movieForm.genre}
                      onChange={(e) => setMovieForm({ ...movieForm, genre: e.target.value })}
                    />
                  </label>
                </div>

                <label>
                  Poster URL (Áp phích dọc)
                  <input
                    type="text"
                    placeholder="https://..."
                    value={movieForm.poster}
                    onChange={(e) => setMovieForm({ ...movieForm, poster: e.target.value })}
                  />
                </label>

                <label>
                  Backdrop URL (Ảnh nền ngang)
                  <input
                    type="text"
                    placeholder="https://..."
                    value={movieForm.backdrop}
                    onChange={(e) => setMovieForm({ ...movieForm, backdrop: e.target.value })}
                  />
                </label>

                <label>
                  Trailer URL (YouTube)
                  <input
                    type="text"
                    placeholder="https://youtube.com/watch?v=..."
                    value={movieForm.trailerUrl}
                    onChange={(e) => setMovieForm({ ...movieForm, trailerUrl: e.target.value })}
                  />
                </label>

                <label>
                  Diễn viên
                  <input
                    placeholder="Diễn viên 1, Diễn viên 2..."
                    value={movieForm.cast}
                    onChange={(e) => setMovieForm({ ...movieForm, cast: e.target.value })}
                  />
                </label>

                <label>
                  Tóm tắt nội dung phim
                  <textarea
                    rows={3}
                    placeholder="Nội dung tóm tắt của bộ phim..."
                    value={movieForm.synopsis}
                    onChange={(e) => setMovieForm({ ...movieForm, synopsis: e.target.value })}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      background: "hsl(var(--color-bg-primary))",
                      border: "1px solid hsl(var(--color-border))",
                      borderRadius: "var(--radius-sm)",
                      color: "#fff",
                      fontFamily: "inherit",
                    }}
                  />
                </label>

                <div style={{ display: "flex", gap: "10px", marginTop: "0.5rem" }}>
                  <button className="btn btn-primary" type="submit" style={{ flex: 1 }}>
                    {editingMovieId ? "Cập nhật phim" : "Lưu phim mới"}
                  </button>
                  {editingMovieId && (
                    <button
                      className="btn btn-secondary"
                      type="button"
                      onClick={handleCancelEdit}
                    >
                      Hủy
                    </button>
                  )}
                </div>
              </form>

              {/* Danh sách phim */}
              <div className="admin-panel">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                  <h2>
                    <Film size={20} /> Danh sách phim ({
                      movies.filter((m) => {
                        const s = !movieSearch || (m.title || "").toLowerCase().includes(movieSearch.toLowerCase());
                        const st = movieStatusFilter === "all" || m.status === movieStatusFilter;
                        return s && st;
                      }).length
                    })
                  </h2>
                </div>

                <div className="movie-admin-table">
                  {movies
                    .filter((m) => {
                      const s = !movieSearch || (m.title || "").toLowerCase().includes(movieSearch.toLowerCase());
                      const st = movieStatusFilter === "all" || m.status === movieStatusFilter;
                      return s && st;
                    })
                    .map((movie) => {
                      const mKey = movie.id || movie._id;
                      const movieSt = getStoredShowtimes()[mKey] || [];
                      const totalShowtimes = movieSt.reduce((acc, d) => acc + (d.times?.length || 0), 0);

                      return (
                        <div className="movie-admin-card" key={movie._id || movie.id}>
                          <img
                            src={movie.poster || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200"}
                            alt={movie.title}
                            className="movie-admin-poster"
                            onError={(e) => {
                              e.target.src = "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=200";
                            }}
                          />
                          <div className="movie-admin-info">
                            <h4 className="movie-admin-title">
                              {movie.title}
                              <span
                                className={`movie-badge ${
                                  movie.status === "showing"
                                    ? "movie-badge-showing"
                                    : movie.status === "upcoming"
                                      ? "movie-badge-upcoming"
                                      : "movie-badge-ended"
                                }`}
                              >
                                {movie.status === "showing"
                                  ? "Đang chiếu"
                                  : movie.status === "upcoming"
                                    ? "Sắp chiếu"
                                    : "Đã kết thúc"}
                              </span>
                            </h4>
                            <div className="movie-admin-meta">
                              <span>⏱️ {typeof movie.duration === "number" ? `${movie.duration} phút` : movie.duration}</span>
                              <span>🔞 {movie.ageRating}</span>
                              <span>🎭 {Array.isArray(movie.genre) ? movie.genre.join(", ") : movie.genre || "Điện ảnh"}</span>
                              <span style={{ color: totalShowtimes > 0 ? "#818cf8" : "#94a3b8", fontWeight: "600" }}>
                                ⏰ {totalShowtimes > 0 ? `${totalShowtimes} suất chiếu tuần` : "Chưa có suất chiếu"}
                              </span>
                            </div>
                          </div>

                          <div className="movie-admin-actions">
                            <button
                              type="button"
                              className="btn-showtimes"
                              onClick={() => handleOpenShowtimeModal(movie)}
                              title="Xem & Chỉnh sửa lịch chiếu"
                            >
                              <Calendar size={15} /> <span>Lịch chiếu</span>
                            </button>
                            <button
                              type="button"
                              className="btn-edit-movie"
                              onClick={() => handleEditMovie(movie)}
                              title="Sửa thông tin phim"
                            >
                              <Edit size={15} /> <span>Sửa</span>
                            </button>
                            <button
                              type="button"
                              className="danger-btn"
                              onClick={() => deleteMovie(movie._id || movie.id)}
                              title="Xóa phim"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* MODAL QUẢN LÝ LỊCH CHIẾU CỦA PHIM */}
            {showtimeModalMovie && (
              <div className="admin-modal-overlay animate-fade-in" onClick={handleCloseShowtimeModal}>
                <div
                  className="admin-modal-card showtime-modal-card"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="admin-modal-header">
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <img
                        src={showtimeModalMovie.poster}
                        alt=""
                        style={{ width: "42px", height: "58px", objectFit: "cover", borderRadius: "4px" }}
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                      <div>
                        <h3>Lịch Chiếu: {showtimeModalMovie.title}</h3>
                        <small style={{ color: "#94a3b8" }}>
                          Thời lượng: {typeof showtimeModalMovie.duration === "number" ? `${showtimeModalMovie.duration} phút` : showtimeModalMovie.duration} · Độ tuổi: {showtimeModalMovie.ageRating}
                        </small>
                      </div>
                    </div>
                    <button className="admin-modal-close" onClick={handleCloseShowtimeModal}>
                      <X size={20} />
                    </button>
                  </div>

                  {/* Nút sinh tự động */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", padding: "10px 14px", background: "rgba(99, 102, 241, 0.1)", borderRadius: "8px", border: "1px solid rgba(99, 102, 241, 0.25)" }}>
                    <div style={{ fontSize: "0.85rem", color: "#c7d2fe" }}>
                      Tạo nhanh 42 suất chiếu cho 7 ngày tới (6 suất/ngày từ 09:00 đến 21:45)
                    </div>
                    <button
                      type="button"
                      className="btn btn-secondary"
                      style={{ fontSize: "0.8rem", padding: "6px 12px", display: "flex", alignItems: "center", gap: "6px" }}
                      onClick={handleAutoGenerateWeekly}
                    >
                      <Sparkles size={15} color="#facc15" /> ⚡ Tạo nhanh lịch tuần
                    </button>
                  </div>

                  {/* Form thêm suất chiếu mới */}
                  <form onSubmit={handleAddShowtime} style={{ background: "rgba(255,255,255,0.03)", padding: "14px", borderRadius: "8px", marginBottom: "1.5rem", border: "1px solid rgba(255,255,255,0.08)" }}>
                    <h4 style={{ margin: "0 0 10px", fontSize: "0.95rem", color: "#f8fafc", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Plus size={16} /> Thêm suất chiếu mới
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
                      <label style={{ fontSize: "0.8rem" }}>
                        Ngày chiếu
                        <input
                          type="date"
                          required
                          value={showtimeForm.date}
                          onChange={(e) => setShowtimeForm({ ...showtimeForm, date: e.target.value })}
                          style={{ padding: "6px 10px", fontSize: "0.85rem", width: "100%" }}
                        />
                      </label>
                      <label style={{ fontSize: "0.8rem" }}>
                        Giờ chiếu
                        <input
                          type="time"
                          required
                          value={showtimeForm.time}
                          onChange={(e) => setShowtimeForm({ ...showtimeForm, time: e.target.value })}
                          style={{ padding: "6px 10px", fontSize: "0.85rem", width: "100%" }}
                        />
                      </label>
                      <label style={{ fontSize: "0.8rem" }}>
                        Cụm rạp
                        <select
                          value={showtimeForm.theaterId}
                          onChange={(e) => setShowtimeForm({ ...showtimeForm, theaterId: e.target.value })}
                          style={{ padding: "6px 10px", fontSize: "0.85rem", width: "100%" }}
                        >
                          {theaters.map((t) => (
                            <option key={t._id || t.id} value={t._id || t.id}>
                              {t.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label style={{ fontSize: "0.8rem" }}>
                        Phòng chiếu
                        <select
                          value={showtimeForm.auditoriumId}
                          onChange={(e) => setShowtimeForm({ ...showtimeForm, auditoriumId: e.target.value })}
                          style={{ padding: "6px 10px", fontSize: "0.85rem", width: "100%" }}
                        >
                          {auditoriums.map((a) => (
                            <option key={a._id || a.id} value={a._id || a.id}>
                              {a.name} ({a.type})
                            </option>
                          ))}
                        </select>
                      </label>
                      <label style={{ fontSize: "0.8rem" }}>
                        Giá vé chuẩn (VNĐ)
                        <input
                          type="number"
                          step="5000"
                          value={showtimeForm.price}
                          onChange={(e) => setShowtimeForm({ ...showtimeForm, price: e.target.value })}
                          style={{ padding: "6px 10px", fontSize: "0.85rem", width: "100%" }}
                        />
                      </label>
                    </div>

                    {/* Quick hour buttons */}
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontSize: "0.75rem", color: "#94a3b8" }}>Chọn nhanh giờ:</span>
                      {["09:00", "11:30", "14:00", "16:30", "19:00", "21:30", "23:00"].map((t) => (
                        <button
                          key={t}
                          type="button"
                          onClick={() => setShowtimeForm({ ...showtimeForm, time: t })}
                          style={{
                            background: showtimeForm.time === t ? "hsl(var(--color-accent))" : "rgba(255,255,255,0.08)",
                            color: "#fff",
                            border: "none",
                            padding: "3px 8px",
                            borderRadius: "4px",
                            fontSize: "0.75rem",
                            cursor: "pointer",
                          }}
                        >
                          {t}
                        </button>
                      ))}
                      <button
                        type="submit"
                        className="btn btn-primary"
                        style={{ marginLeft: "auto", fontSize: "0.82rem", padding: "6px 14px" }}
                      >
                        <Plus size={15} /> Thêm suất chiếu
                      </button>
                    </div>
                  </form>

                  {/* Danh sách suất chiếu hiện tại */}
                  <div>
                    <h4 style={{ margin: "0 0 12px", fontSize: "1rem", color: "#fff", display: "flex", alignItems: "center", gap: "8px" }}>
                      <CalendarDays size={18} /> Các suất chiếu hiện có
                    </h4>

                    {(() => {
                      const mKey = showtimeModalMovie.id || showtimeModalMovie._id;
                      const dateList = getStoredShowtimes()[mKey] || [];

                      if (dateList.length === 0) {
                        return (
                          <div style={{ textAlign: "center", padding: "2rem", color: "#94a3b8", background: "rgba(255,255,255,0.02)", borderRadius: "8px" }}>
                            Phim này chưa có suất chiếu nào. Bạn có thể bấm "⚡ Tạo nhanh lịch tuần" ở trên để tự động tạo lịch chiếu.
                          </div>
                        );
                      }

                      return dateList.map((entry) => (
                        <div className="showtime-date-box" key={entry.date}>
                          <div className="showtime-date-header">
                            <Calendar size={15} color="#818cf8" />
                            <span>Ngày {new Date(entry.date).toLocaleDateString("vi-VN", { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" })} ({entry.date})</span>
                            <small style={{ marginLeft: "auto", color: "#94a3b8", fontWeight: "normal" }}>
                              {entry.times?.length || 0} suất
                            </small>
                          </div>
                          <div className="showtime-pills">
                            {(entry.times || []).map((tItem) => (
                              <div className="showtime-pill" key={tItem.showtimeId || tItem.time}>
                                <Clock size={13} color="#94a3b8" />
                                <strong>{tItem.time}</strong>
                                {tItem.format && <small style={{ color: "#a5b4fc" }}>({tItem.format})</small>}
                                <button
                                  type="button"
                                  onClick={() => handleDeleteShowtime(entry.date, tItem.time, tItem.showtimeId)}
                                  title={`Xóa suất ${tItem.time}`}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
            )}
          </section>
        )}

        {/* ==================================================== */}
        {/* 4. COMBOS (F&B / BẮP NƯỚC)                           */}
        {/* ==================================================== */}
        {section === "combos" && (
          <section className="admin-content admin-two-col">
            <form className="admin-panel admin-form" onSubmit={createCombo}>
              <h2>
                <Plus size={20} /> Thêm combo bắp nước
              </h2>
              <label>
                Tên combo *
                <input
                  required
                  placeholder="Ví dụ: Combo Sweet 2 Bắp + 2 Nước"
                  value={comboForm.name}
                  onChange={(e) => setComboForm({ ...comboForm, name: e.target.value })}
                />
              </label>
              <label>
                Mô tả chi tiết
                <input
                  placeholder="1 bắp ngọt lớn + 2 ly Coca Cola 32oz..."
                  value={comboForm.description}
                  onChange={(e) => setComboForm({ ...comboForm, description: e.target.value })}
                />
              </label>
              <label>
                Giá bán (VNĐ) *
                <input
                  type="number"
                  required
                  placeholder="89000"
                  value={comboForm.price}
                  onChange={(e) => setComboForm({ ...comboForm, price: e.target.value })}
                />
              </label>
              <label>
                Giá gốc trước giảm (VNĐ)
                <input
                  type="number"
                  placeholder="110000"
                  value={comboForm.originalPrice}
                  onChange={(e) => setComboForm({ ...comboForm, originalPrice: e.target.value })}
                />
              </label>
              <label>
                Hình ảnh combo (URL)
                <input
                  type="text"
                  placeholder="https://..."
                  value={comboForm.image}
                  onChange={(e) => setComboForm({ ...comboForm, image: e.target.value })}
                />
              </label>
              <button className="btn btn-primary" type="submit">
                Thêm combo
              </button>
            </form>

            <div className="admin-panel">
              <h2>Menu bắp nước ({combos.length})</h2>
              <div className="admin-grid-cards">
                {combos.map((combo) => (
                  <div className="admin-card-item" key={combo._id}>
                    <div>
                      <div className="admin-card-title">{combo.name}</div>
                      <div className="admin-card-desc">{combo.description || "Không có mô tả"}</div>
                    </div>
                    <div className="admin-card-footer">
                      <strong style={{ color: "#4ade80" }}>{(combo.price || 0).toLocaleString("vi-VN")} đ</strong>
                      <button className="danger-btn" onClick={() => deleteCombo(combo._id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {combos.length === 0 && <p>Chưa có combo bắp nước nào. Vui lòng thêm mới ở form bên trái.</p>}
              </div>
            </div>
          </section>
        )}

        {/* ==================================================== */}
        {/* 5. MARKETING & VOUCHERS                              */}
        {/* ==================================================== */}
        {section === "marketing" && (
          <section className="admin-content admin-two-col">
            <form className="admin-panel admin-form" onSubmit={createPromotion}>
              <h2>
                <Tag size={20} /> Tạo mã voucher / coupon
              </h2>
              <label>
                Mã giảm giá (Code) *
                <input
                  required
                  placeholder="Ví dụ: CINEVITE50, VIP30K..."
                  value={promoForm.code}
                  onChange={(e) => setPromoForm({ ...promoForm, code: e.target.value.toUpperCase() })}
                />
              </label>
              <label>
                Tên chương trình khuyến mãi *
                <input
                  required
                  placeholder="Ví dụ: Ưu đãi mùa hè giảm 20k"
                  value={promoForm.name}
                  onChange={(e) => setPromoForm({ ...promoForm, name: e.target.value })}
                />
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                <label>
                  Loại giảm
                  <select
                    value={promoForm.type}
                    onChange={(e) => setPromoForm({ ...promoForm, type: e.target.value })}
                  >
                    <option value="percentage">Theo %</option>
                    <option value="fixed">Số tiền cố định (VNĐ)</option>
                  </select>
                </label>
                <label>
                  Giá trị giảm *
                  <input
                    type="number"
                    required
                    placeholder={promoForm.type === "percentage" ? "10 (10%)" : "20000"}
                    value={promoForm.value}
                    onChange={(e) => setPromoForm({ ...promoForm, value: e.target.value })}
                  />
                </label>
              </div>
              <label>
                Đơn hàng tối thiểu (VNĐ)
                <input
                  type="number"
                  placeholder="0"
                  value={promoForm.minOrderAmount}
                  onChange={(e) => setPromoForm({ ...promoForm, minOrderAmount: e.target.value })}
                />
              </label>
              <label>
                Số lượt dùng tối đa
                <input
                  type="number"
                  placeholder="100"
                  value={promoForm.usageLimit}
                  onChange={(e) => setPromoForm({ ...promoForm, usageLimit: e.target.value })}
                />
              </label>
              <button className="btn btn-primary" type="submit">
                Tạo mã voucher
              </button>
            </form>

            <div className="admin-panel">
              <h2>Mã khuyến mãi đang có ({promotions.length})</h2>
              <div className="admin-grid-cards">
                {promotions.map((promo) => (
                  <div className="admin-card-item" key={promo._id}>
                    <div>
                      <div className="admin-card-title">{promo.code}</div>
                      <div className="admin-card-desc">{promo.name}</div>
                      <small style={{ color: "hsl(var(--color-text-secondary))", display: "block", marginBottom: "0.5rem" }}>
                        Giảm: {promo.type === "percentage" ? `${promo.value}%` : `${promo.value?.toLocaleString("vi-VN")} đ`} ·{" "}
                        Đã dùng: {promo.usedCount || 0}/{promo.usageLimit || "∞"}
                      </small>
                    </div>
                    <div className="admin-card-footer">
                      <span className="admin-badge paid">Hoạt động</span>
                      <button className="danger-btn" onClick={() => deletePromotion(promo._id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {promotions.length === 0 && <p>Chưa có mã giảm giá nào trong hệ thống.</p>}
              </div>
            </div>
          </section>
        )}

        {/* ==================================================== */}
        {/* 6. REVIEWS MODERATION                                */}
        {/* ==================================================== */}
        {section === "reviews" && (
          <section className="admin-content">
            <div className="admin-panel">
              <h2>
                <Star size={20} /> Kiểm duyệt đánh giá & bình luận ({reviews.length})
              </h2>
              <div className="admin-table">
                {reviews.map((rev) => (
                  <div className="admin-row" key={rev._id}>
                    <div>
                      <strong>
                        {rev.movie?.title || "Phim"} · {rev.rating}/10 ⭐
                      </strong>
                      <p style={{ margin: "0.25rem 0", color: "#e2e8f0" }}>"{rev.comment}"</p>
                      <small>
                        Bởi: {rev.user?.name || "Khách"} ({rev.user?.email || "N/A"}) ·{" "}
                        {rev.isApproved ? "Đã duyệt hiển thị" : "Đang chờ duyệt"}
                      </small>
                    </div>
                    <div style={{ display: "flex", gap: "0.5rem" }}>
                      <button
                        className={`btn-action-sm ${rev.isApproved ? "btn-action-cancel" : "btn-action-collect"}`}
                        onClick={() => approveReview(rev._id, !rev.isApproved)}
                      >
                        {rev.isApproved ? "Ẩn" : "Duyệt hiển thị"}
                      </button>
                      <button className="danger-btn" onClick={() => deleteReview(rev._id)} title="Xóa">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {reviews.length === 0 && <p>Chưa có đánh giá nào từ người dùng.</p>}
              </div>
            </div>
          </section>
        )}

        {/* ==================================================== */}
        {/* 7. USERS & RBAC                                      */}
        {/* ==================================================== */}
        {section === "users" && (
          <section className="admin-content">
            <div className="admin-toolbar">
              <div className="admin-toolbar-left">
                <input
                  type="text"
                  placeholder="Tìm theo tên, email, SĐT..."
                  className="admin-search-input"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                />
                <select
                  className="admin-filter-select"
                  value={userRoleFilter}
                  onChange={(e) => setUserRoleFilter(e.target.value)}
                >
                  <option value="all">Tất cả vai trò</option>
                  <option value="user">Khách hàng</option>
                  <option value="staff">Nhân viên (Staff)</option>
                  <option value="manager">Quản lý (Manager)</option>
                  <option value="admin">Quản trị viên (Admin)</option>
                  <option value="superadmin">Toàn quyền (Superadmin)</option>
                </select>
              </div>
              <div className="admin-toolbar-right">
                <button className="btn-csv" onClick={handleExportUsers}>
                  <Download size={16} /> Xuất DS Khách Hàng (CSV)
                </button>
              </div>
            </div>

            <div className="admin-panel">
              <h2>
                <Users size={20} /> Quản lý người dùng ({filteredUsers.length})
              </h2>
              <div className="admin-table">
                {filteredUsers.map((item) => (
                  <div className="admin-row" key={item._id}>
                    <span>
                      <strong>{item.name}</strong>
                      <small>
                        {item.email} · {item.phone || "Chưa có SĐT"} · {item.isActive ? "Đang hoạt động" : "Đã khóa"}
                      </small>
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                      <select
                        value={item.role}
                        onChange={(e) => updateUserRole(item._id, e.target.value)}
                        className="admin-filter-select"
                      >
                        <option value="user">Khách hàng</option>
                        <option value="staff">Staff</option>
                        <option value="manager">Manager</option>
                        <option value="admin">Admin</option>
                        <option value="superadmin">Superadmin</option>
                      </select>
                      <button
                        className="danger-btn"
                        onClick={() => updateUserStatus(item._id, !item.isActive)}
                      >
                        {item.isActive ? "Khóa" : "Mở"}
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ==================================================== */}
        {/* 8. CMS: BANNERS & CONTENT                            */}
        {/* ==================================================== */}
        {section === "cms" && (
          <section className="admin-content admin-two-col">
            <form className="admin-panel admin-form" onSubmit={addBanner}>
              <h2>
                <Plus size={20} /> Thêm Banner Slider Trang Chủ
              </h2>
              <label>
                Tiêu đề banner *
                <input
                  required
                  placeholder="Ví dụ: Siêu phẩm mùa hè 2026..."
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                />
              </label>
              <label>
                Hình ảnh Banner (URL) *
                <input
                  required
                  placeholder="https://..."
                  value={bannerForm.image}
                  onChange={(e) => setBannerForm({ ...bannerForm, image: e.target.value })}
                />
              </label>
              <label>
                Đường dẫn liên kết (Link)
                <input
                  placeholder="/movies hoặc link phim..."
                  value={bannerForm.link}
                  onChange={(e) => setBannerForm({ ...bannerForm, link: e.target.value })}
                />
              </label>
              <button className="btn btn-primary" type="submit">
                Thêm banner
              </button>
            </form>

            <div className="admin-panel">
              <h2>Banner trang chủ ({banners.length})</h2>
              <div className="admin-table">
                {banners.map((b) => (
                  <div className="admin-row" key={b.id}>
                    <span>
                      <strong>{b.title}</strong>
                      <small>{b.link || "/"}</small>
                    </span>
                    <button className="danger-btn" onClick={() => deleteBanner(b.id)}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))}
                {banners.length === 0 && <p>Chưa có banner nào.</p>}
              </div>
            </div>
          </section>
        )}

        {/* ==================================================== */}
        {/* 9. SETTINGS & AUDIT LOGS                             */}
        {/* ==================================================== */}
        {section === "settings" && (
          <section className="admin-content">
            <div className="admin-panel" style={{ marginBottom: "2rem" }}>
              <h2>
                <Sliders size={20} /> Cấu hình website & Cổng thanh toán
              </h2>
              <div className="admin-table">
                <div className="admin-row">
                  <span>
                    <strong>Cổng thanh toán MoMo QR</strong>
                    <small>Bật/tắt thanh toán qua Ví MoMo trên trang Checkout</small>
                  </span>
                  <button className="btn btn-secondary" onClick={() => updateSetting("gateway_momo", true)}>
                    Đang bật
                  </button>
                </div>
                <div className="admin-row">
                  <span>
                    <strong>Cổng thanh toán ZaloPay</strong>
                    <small>Bật/tắt thanh toán qua ZaloPay</small>
                  </span>
                  <button className="btn btn-secondary" onClick={() => updateSetting("gateway_zalopay", true)}>
                    Đang bật
                  </button>
                </div>
                <div className="admin-row">
                  <span>
                    <strong>Thanh toán tại quầy (Cash)</strong>
                    <small>Cho phép khách đặt giữ chỗ và thanh toán tại quầy vé</small>
                  </span>
                  <button className="btn btn-secondary" onClick={() => updateSetting("gateway_cash", true)}>
                    Đang bật
                  </button>
                </div>
                <div className="admin-row">
                  <span>
                    <strong>Hotline hỗ trợ khách hàng</strong>
                    <small>Số điện thoại hiển thị trên Header và Footer (Mặc định: 1900 6868)</small>
                  </span>
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      const val = window.prompt("Nhập Hotline mới:", "1900 6868");
                      if (val) updateSetting("hotline", val);
                    }}
                  >
                    Chỉnh sửa
                  </button>
                </div>
              </div>
            </div>

            <div className="admin-panel">
              <h2>
                <ShieldCheck size={20} /> Nhật ký hệ thống (Audit Trail)
              </h2>
              <div className="admin-table">
                {auditLogs.slice(0, 20).map((log) => (
                  <div className="admin-row" key={log._id}>
                    <span>
                      <strong>{log.action?.toUpperCase()} ({log.resource})</strong>
                      <small>
                        Thực hiện bởi: {log.user?.name || "Admin"} ({log.user?.email || "N/A"}) ·{" "}
                        {new Date(log.createdAt).toLocaleString("vi-VN")} · IP: {log.ip || "127.0.0.1"}
                      </small>
                    </span>
                  </div>
                ))}
                {auditLogs.length === 0 && <p>Chưa có bản ghi nhật ký nào.</p>}
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
};

export default AdminApp;
