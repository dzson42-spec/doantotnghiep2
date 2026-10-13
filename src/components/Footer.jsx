import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="container footer-container">
        <div className="footer-section">
          <h3 className="footer-title">CineVite</h3>
          <p className="footer-text">Hệ thống đặt vé xem phim trực tuyến hàng đầu với trải nghiệm tuyệt vời nhất.</p>
        </div>
        <div className="footer-section">
          <h4 className="footer-subtitle">Liên kết</h4>
          <ul className="footer-links">
            <li><a href="#!" onClick={(e) => { e.preventDefault(); alert('Trang Về chúng tôi đang phát triển'); }}>Về chúng tôi</a></li>
            <li><a href="#!" onClick={(e) => e.preventDefault()}>Điều khoản sử dụng</a></li>
            <li><a href="#!" onClick={(e) => e.preventDefault()}>Chính sách bảo mật</a></li>
          </ul>
        </div>
        <div className="footer-section">
          <h4 className="footer-subtitle">Hỗ trợ</h4>
          <ul className="footer-links">
            <li><a href="#!" onClick={(e) => e.preventDefault()}>FAQ</a></li>
            <li><a href="#!" onClick={(e) => e.preventDefault()}>Liên hệ</a></li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2026 CineVite. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;
