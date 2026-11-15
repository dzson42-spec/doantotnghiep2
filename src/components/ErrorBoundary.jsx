import React from "react";
import { AlertTriangle, RefreshCw, Trash2, Home } from "lucide-react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    try {
      localStorage.removeItem("cinevite_movies");
      localStorage.removeItem("cinevite_showtimes");
      localStorage.removeItem("cinevite_theaters");
      localStorage.removeItem("tempBooking");
    } catch (e) {
      console.error(e);
    }
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#0b0f19",
            color: "#fff",
            padding: "20px",
            fontFamily: "'Inter', system-ui, sans-serif",
          }}
        >
          <div
            style={{
              background: "#161d2f",
              border: "1px solid rgba(225, 29, 72, 0.4)",
              borderRadius: "16px",
              padding: "36px 32px",
              maxWidth: "520px",
              width: "100%",
              textAlign: "center",
              boxShadow: "0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(225, 29, 72, 0.15)",
                color: "#f43f5e",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 20px",
              }}
            >
              <AlertTriangle size={36} />
            </div>
            <h2 style={{ fontSize: "22px", marginBottom: "10px", fontWeight: "700" }}>
              Đã xảy ra sự cố hiển thị
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "14px", lineHeight: "1.6", marginBottom: "24px" }}>
              Trình duyệt có thể đang lưu bộ nhớ tạm cũ hoặc dữ liệu xung đột. Vui lòng bấm làm mới hoặc khôi phục dữ liệu gốc để ứng dụng chạy mượt mà.
            </p>

            <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
              <button
                onClick={this.handleReload}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#e11d48",
                  color: "#fff",
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "600",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                <RefreshCw size={16} /> Tải lại trang
              </button>

              <button
                onClick={this.handleReset}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#21262d",
                  color: "#e2e8f0",
                  border: "1px solid #30363d",
                  padding: "10px 20px",
                  borderRadius: "8px",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                <Trash2 size={16} /> Khôi phục dữ liệu gốc
              </button>

              <button
                onClick={() => { window.location.href = "/"; }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "transparent",
                  color: "#94a3b8",
                  border: "1px solid rgba(255,255,255,0.1)",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  fontWeight: "500",
                  cursor: "pointer",
                  fontSize: "14px",
                }}
              >
                <Home size={16} /> Về trang chủ
              </button>
            </div>

            {this.state.error && (
              <details style={{ marginTop: "20px", textAlign: "left", fontSize: "12px", color: "#64748b" }}>
                <summary style={{ cursor: "pointer", marginBottom: "6px" }}>Chi tiết lỗi kỹ thuật</summary>
                <pre
                  style={{
                    background: "#0d1117",
                    padding: "10px",
                    borderRadius: "6px",
                    overflowX: "auto",
                    color: "#f87171",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {String(this.state.error?.stack || this.state.error?.message || this.state.error)}
                </pre>
              </details>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
