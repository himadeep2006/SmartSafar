import React, { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  FaCompass,
  FaLanguage,
  FaShieldAlt,
  FaUserCircle,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaSuitcaseRolling,
} from "react-icons/fa";
import "./Navbar.css";
import { useAuth } from "../auth/AuthContext";


export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const { user, logout: clearSession } = useAuth();
  const username = user?.username || "Explorer";

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const logout = () => {
    clearSession();
    navigate("/login", { replace: true });
  };

  const isActive = (path) => location.pathname === path;

  // Active & Scalable Navigation Links
  const navItems = [
    { label: "Explore", path: "/dashboard", icon: <FaCompass /> },
    { label: "My Trips", path: "/trips", icon: <FaSuitcaseRolling /> },
    { label: "Languages", path: "/languages", icon: <FaLanguage /> },
    { label: "Safety", path: "/safety", icon: <FaShieldAlt /> },
    { label: "Profile", path: "/profile", icon: <FaUserCircle /> },
  ];

  /* 
    Future Routes Ready for Extension:
    - { label: "Planner", path: "/planner", icon: <FaMapMarkedAlt /> }
    - { label: "Trips", path: "/trips", icon: <FaSuitcaseRolling /> }
  */

  return (
    <header className={`navbar-wrapper ${scrolled ? "scrolled" : ""}`}>
      <nav className="glass-navbar">
        {/* BRAND LOGO */}
        <Link to="/dashboard" className="navbar-brand">
          <div className="brand-badge">
            <span className="brand-plane-icon">✈</span>
          </div>
          <div className="brand-text-wrapper">
            <span className="brand-title">SMARTSAFAR</span>
            <span className="brand-tagline">AI TRAVEL COMPANION</span>
          </div>
        </Link>

        {/* DESKTOP NAV LINKS */}
        <div className="desktop-nav-links">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item-link ${active ? "active" : ""}`}
              >
                <span className="nav-item-icon">{item.icon}</span>
                <span>{item.label}</span>
                {active && <div className="active-glow-line" />}
              </Link>
            );
          })}
        </div>

        {/* USER PROFILE & LOGOUT SECTION */}
        <div className="desktop-user-section">
          <div className="user-profile-badge">
            <div className="user-avatar">
              {username.charAt(0).toUpperCase()}
            </div>
            <span className="user-name-text">{username}</span>
          </div>

          <button
            onClick={logout}
            className="navbar-logout-btn"
            title="Log out of SmartSafar"
            aria-label="Logout"
          >
            <FaSignOutAlt className="logout-icon" />
            <span className="logout-text">Logout</span>
          </button>
        </div>

        {/* MOBILE HAMBURGER TOGGLE */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="mobile-hamburger-btn"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <FaTimes /> : <FaBars />}
        </button>

        {/* MOBILE DRAWER MENU */}
        {mobileMenuOpen && (
          <div className="mobile-drawer-overlay animate-fade-in">
            <div className="mobile-drawer-content">
              <div className="mobile-user-card">
                <div className="user-avatar large">
                  {username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="text-white font-bold">{username}</h4>
                  <p className="text-xs text-amber-400 font-medium">SmartSafar Traveller</p>
                </div>
              </div>

              <div className="mobile-nav-list">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`mobile-nav-item ${isActive(item.path) ? "active" : ""}`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              <button onClick={logout} className="mobile-logout-btn">
                <FaSignOutAlt />
                <span>Logout</span>
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
