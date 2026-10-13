import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import MovieDetail from "./pages/MovieDetail";
import SeatSelection from "./pages/SeatSelection";
import Checkout from "./pages/Checkout";
import MoviesList from "./pages/MoviesList";
import TheatersList from "./pages/TheatersList";
import AuthPage from "./pages/AuthPage";
import AccountPage from "./pages/AccountPage";
import AdminApp from "./pages/AdminApp";
import OrderLookup from "./pages/OrderLookup";
import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/admin/*" element={<AdminApp />} />
        <Route
          path="*"
          element={
            <div className="app-wrapper">
              <Header />
              <main className="main-content">
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/auth" element={<AuthPage />} />
                  <Route path="/account" element={<AccountPage />} />
                  <Route path="/movies" element={<MoviesList />} />
                  <Route path="/theaters" element={<TheatersList />} />
                  <Route path="/lookup" element={<OrderLookup />} />
                  <Route path="/movie/:id" element={<MovieDetail />} />
                  <Route path="/book/:id" element={<SeatSelection />} />
                  <Route path="/checkout" element={<Checkout />} />
                </Routes>
              </main>
              <Footer />
            </div>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
