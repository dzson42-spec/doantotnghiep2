# CineVite - Hệ Thống Đặt Vé Xem Phim Trực Tuyến

> Đồ án tốt nghiệp hệ thống website bán vé xem phim trực tuyến CineVite  
> Sinh viên thực hiện: **Chu Thiên Sơn** - MSSV: **523100111**

---

## 🚀 Hướng Dẫn Khởi Động Nhanh (1 Click)

### Cách 1: Chạy file `start.bat` (Khuyên dùng trên Windows)
- Nhấp đúp chuột vào file **`start.bat`** tại thư mục gốc dự án.
- File sẽ tự động dọn dẹp tiến trình cũ, khởi động máy chủ tại cổng cố định `http://localhost:5173` và tự động mở Google Chrome.

### Cách 2: Chạy bằng dòng lệnh Terminal
```bash
# Cài đặt thư viện nếu chưa cài
npm install

# Khởi động ứng dụng (tự động dọn cổng 5173 và mở trình duyệt)
npm run dev
```

---

## 🔑 Tài Khoản Thử Nghiệm

| Vai trò | Email đăng nhập | Mật khẩu | Chức năng chính |
| :--- | :--- | :--- | :--- |
| **Khách hàng** | `schu1325@gmail.com` | `123456` | Xem phim, chọn ghế xem phim, nhận mã QR vé, xem lịch sử đặt vé |
| **Quản trị viên** | `thiensonadmin@gmail.com` | `123456` | Quản lý phim, suất chiếu, phòng rạp, thống kê doanh thu, duyệt vé |
| **Quản trị cấp cao** | `admin@cinevite.local` | `admin123` | Toàn quyền cấu hình hệ thống CineVite |

*(Trên các trang Đăng nhập và Đăng nhập Quản trị đều có nút bấm đăng nhập nhanh 1 chạm để thuận tiện chấm thi và bảo vệ đồ án).*

---

## 🎟️ Mã Khuyến Mãi Demo (Tại màn hình thanh toán)
- `CINEVITE10`: Giảm 10% tổng đơn hàng
- `VIP20K`: Giảm trực tiếp 20.000 VNĐ
- `CHAOBANMOI`: Giảm 15% cho thành viên mới

## 🔍 Tra Cứu Đơn Hàng Mẫu (Tại trang Tra Cứu Vé)
- Mã vé mẫu: `CVCDFC0704`
- Email tra cứu: `schu1325@gmail.com`
- SĐT tra cứu: `0962744848`

---

## 🛠️ Công Nghệ Sử Dụng
- **Giao diện:** React 19, Vite 8, React Router v7
- **Bộ icon & Hiệu ứng:** Lucide React, Google Fonts (Space Grotesk & Inter)
- **Tạo mã QR:** QRCode.react (hiển thị mã QR vé điện tử thời gian thực)
- **Cơ chế lưu trữ:** LocalStorage API & Custom Events (đồng bộ dữ liệu thời gian thực giữa giao diện khách và trang quản trị mà không cần phụ thuộc máy chủ bên ngoài).
