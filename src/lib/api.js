const API_URL = import.meta.env.VITE_API_URL || "/api";

export const apiRequest = async (path, options = {}) => {
  const token = localStorage.getItem("cinevite_access_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    credentials: "include",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg =
      payload.details && payload.details.length
        ? payload.details.join(", ")
        : payload.message || "Yêu cầu thất bại";
    throw new Error(errorMsg);
  }
  return payload.data;
};

export const login = async (identifier, password) => {
  const data = await apiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
  localStorage.setItem("cinevite_access_token", data.accessToken);
  return data.user;
};

export const register = async (name, email, password, phone) => {
  const data = await apiRequest("/auth/register", {
    method: "POST",
    body: JSON.stringify({ name, email, password, phone }),
  });
  localStorage.setItem("cinevite_access_token", data.accessToken);
  return data.user;
};

export const forgotPassword = async (email) => {
  const data = await apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
  return data.resetToken;
};

export const resetPassword = async (token, password) => {
  return apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, password }),
  });
};

export const logout = async () => {
  try {
    await apiRequest("/auth/logout", { method: "POST" });
  } finally {
    localStorage.removeItem("cinevite_access_token");
  }
};

export const validatePromotion = async (code, orderAmount) => {
  return apiRequest("/promotions/validate", {
    method: "POST",
    body: JSON.stringify({ code, orderAmount }),
  });
};

export const lookupGuestBooking = async (code, contact) => {
  const params = new URLSearchParams({ code, contact });
  return apiRequest(`/bookings/lookup?${params.toString()}`);
};

export const claimGuestBooking = async (code) => {
  return apiRequest("/bookings/claim", {
    method: "POST",
    body: JSON.stringify({ code }),
  });
};

export const adminApiRequest = async (path, options = {}) => {
  const token = localStorage.getItem("cinevite_admin_access_token");
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
    credentials: "include",
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMsg =
      payload.details && payload.details.length
        ? payload.details.join(", ")
        : payload.message || "Yêu cầu thất bại";
    throw new Error(errorMsg);
  }
  return payload.data;
};

export const adminLogin = async (identifier, password) => {
  const data = await adminApiRequest("/auth/login", {
    method: "POST",
    body: JSON.stringify({ identifier, password }),
  });
  localStorage.setItem("cinevite_admin_access_token", data.accessToken);
  return data.user;
};

export const adminLogout = async () => {
  try {
    await adminApiRequest("/auth/logout", { method: "POST" });
  } finally {
    localStorage.removeItem("cinevite_admin_access_token");
  }
};
