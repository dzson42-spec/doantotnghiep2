import React, { useEffect, useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Film, User, Search, Menu, X, LogIn, UserPlus, LogOut, UserRound, Ticket, ShieldCheck } from "lucide-react";
import { logout } from "../lib/api";
import "./Header.css";

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("currentUser"));
    } catch {
      return null;
    }
  });

  const navigate = useNavigate();

  useEffect(() => {
    const syncUser = () => {
      try {
        setCurrentUser(JSON.parse(localStorage.getItem("currentUser")));
      } catch {
        setCurrentUser(null);
      }
    };
    window.addEventListener("authChange", syncUser);
    return () => window.removeEventListener("authChange", syncUser);
  }, []);

  // Click outside to close user dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/movies?search=${encodeURIComponent(searchQuery)}`);
      setIsSearchOpen(false);
    }
  };

  const handleLogout = async () => {
    setIsUserMenuOpen(false);
    try {
      await logout();
    } catch {
      // ignore
    }
    localStorage.removeItem("currentUser");
    localStorage.removeItem("cinevite_access_token");
    setCurrentUser(null);
    window.dispatchEvent(new Event("authChange"));
    navigate("/");
  };

  return (
    <header className="header">
      <div className="container header-container">
        <Link to="/" className="logo" onClick={() => setIsMenuOpen(false)}>
          <Film className="logo-icon" />
          <span>CineVite</span>
        </Link>

        <nav className={`nav-links ${isMenuOpen ? "open" : ""}`}>
          <Link
            to="/"
            className="nav-link"
            onClick={() => setIsMenuOpen(false)}
          >
            Trang Chủ
          </Link>
          <Link
            to="/movies"
            className="nav-link"
            onClick={() => setIsMenuOpen(false)}
          >
            Phim Đang Chiếu
          </Link>
          <Link
            to="/theaters"
            className="nav-link"
            onClick={() => setIsMenuOpen(false)}
          >
            Rạp & Lịch Chiếu
          </Link>
          <Link
            to="/lookup"
            className="nav-link"
            onClick={() => setIsMenuOpen(false)}
          >
            Tra Cứu Vé
          </Link>
          {['admin', 'superadmin'].includes(currentUser?.role) && (
            <Link
              to="/admin"
              className="nav-link nav-link-admin"
              onClick={() => setIsMenuOpen(false)}
              style={{
                color: "#f43f5e",
                fontWeight: "600",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <ShieldCheck size={17} /> Quản Trị Web
            </Link>
          )}
        </nav>

        <div className="header-actions">
          {isSearchOpen ? (
            <form
              onSubmit={handleSearch}
              className="search-form animate-fade-in"
            >
              <input
                type="text"
                placeholder="Tìm phim..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              <button
                type="button"
                className="icon-btn"
                onClick={() => setIsSearchOpen(false)}
              >
                <X size={18} />
              </button>
            </form>
          ) : (
            <button
              className="icon-btn"
              aria-label="Search"
              onClick={() => setIsSearchOpen(true)}
            >
              <Search size={20} />
            </button>
          )}

          {/* User Icon & Dropdown Menu */}
          <div className="user-menu-wrapper" ref={userMenuRef}>
            <button
              className={`icon-btn user-btn ${currentUser ? "logged-in" : ""}`}
              aria-label="User Account"
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              title={currentUser ? `Tài khoản: ${currentUser.name}` : "Tài khoản / Đăng nhập"}
            >
              <User size={20} />
            </button>

            {isUserMenuOpen && (
              <div className="user-dropdown-menu animate-fade-in">
                {currentUser ? (
                  <>
                    <div className="user-dropdown-header">
                      <span className="user-dropdown-name">{currentUser.name}</span>
                      <span className="user-dropdown-email">{currentUser.email}</span>
                      {['admin', 'superadmin'].includes(currentUser.role) && (
                        <span
                          style={{
                            display: "inline-block",
                            marginTop: "4px",
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#f43f5e",
                            background: "rgba(244, 63, 94, 0.15)",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            width: "fit-content",
                          }}
                        >
                          Quản trị viên (Admin)
                        </span>
                      )}
                    </div>
                    {['admin', 'superadmin'].includes(currentUser.role) && (
                      <Link
                        to="/admin"
                        className="user-dropdown-item"
                        style={{
                          color: "#f43f5e",
                          fontWeight: "600",
                          background: "rgba(244, 63, 94, 0.1)",
                        }}
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        <ShieldCheck size={16} /> Bảng Quản Trị Hệ Thống
                      </Link>
                    )}
                    <Link
                      to="/account"
                      className="user-dropdown-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <UserRound size={16} /> Thông tin tài khoản
                    </Link>
                    <Link
                      to="/account"
                      className="user-dropdown-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Ticket size={16} /> Lịch sử đặt vé
                    </Link>
                    <div className="user-dropdown-divider" />
                    <button
                      className="user-dropdown-item text-danger"
                      onClick={handleLogout}
                    >
                      <LogOut size={16} /> Đăng xuất
                    </button>
                  </>
                ) : (
                  <>
                    <div className="user-dropdown-header">
                      <span className="user-dropdown-title">Tài khoản CineVite</span>
                      <span className="user-dropdown-desc">
                        Đăng nhập để đặt vé và nhận các ưu đãi thành viên
                      </span>
                    </div>
                    <div className="user-dropdown-actions">
                      <button
                        className="btn btn-primary btn-full user-dropdown-btn"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigate("/auth?mode=login");
                        }}
                      >
                        <LogIn size={16} /> Đăng nhập
                      </button>
                      <button
                        className="btn btn-secondary btn-full user-dropdown-btn"
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          navigate("/auth?mode=register");
                        }}
                      >
                        <UserPlus size={16} /> Đăng ký tài khoản
                      </button>
                    </div>
                    <div className="user-dropdown-divider" />
                    <Link
                      to="/lookup"
                      className="user-dropdown-item"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <Search size={16} /> Tra cứu vé vãng lai
                    </Link>
                  </>
                )}
              </div>
            )}
          </div>

          <button
            className="icon-btn mobile-menu-btn"
            aria-label="Menu"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
