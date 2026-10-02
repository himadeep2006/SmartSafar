import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import api from "../lib/api";
import { getAuthError } from "../lib/authError";
import "./Signup.css";

function Signup() {
  const navigate = useNavigate();
  const { establishSession } = useAuth();
  const [form, setForm] = useState({ username: "", email: "", password: "", passwordConfirm: "" });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
    setError("");
  };

  const handleSignup = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;

    const username = form.username.trim();
    if (!/^[A-Za-z0-9_-]{3,32}$/.test(username)) {
      setError("Use 3–32 letters, numbers, underscores, or hyphens for your username.");
      return;
    }
    const email = form.email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }
    if (form.password.length < 8 || !/[A-Za-z]/.test(form.password) || !/[0-9]/.test(form.password)) {
      setError("Use at least 8 characters, including a letter and a number, for your password.");
      return;
    }
    if (form.password !== form.passwordConfirm) {
      setError("Your passwords don’t match.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/signup", { ...form, username, email });
      establishSession(response.data);
      navigate("/dashboard", { replace: true });
    } catch (requestError) {
      setError(getAuthError(requestError, "We couldn’t create your account. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="signup-page">
      <div className="signup-background">
        <div className="signup-overlay"></div>
        <div className="signup-content">
          <div className="signup-hero">
            <div className="signup-brand">
              <span className="signup-brand-icon" aria-hidden="true">✈</span>
              <span>SMARTSAFAR</span>
            </div>
            <div className="signup-hero-text">
              <p className="signup-small-title">START • EXPLORE • DISCOVER</p>
              <h1>YOUR<br />JOURNEY</h1>
              <p className="signup-description">Create your account and start<br />discovering the world.</p>
              <p className="signup-subtitle">Personalized journeys, safer travels,<br />and unforgettable experiences.</p>
            </div>
          </div>

          <div className="signup-card">
            <div className="signup-card-header">
              <div className="signup-icon" aria-hidden="true">✈</div>
              <h2>Create Account</h2>
              <p>Start your journey with SmartSafar</p>
            </div>

            <form onSubmit={handleSignup} aria-busy={isSubmitting} noValidate>
              <div className="signup-input-group">
                <label htmlFor="signup-username">Username</label>
                <input id="signup-username" type="text" name="username" autoComplete="username" placeholder="Enter your username" value={form.username} onChange={handleChange} required minLength={3} maxLength={32} disabled={isSubmitting} />
              </div>
              <div className="signup-input-group">
                <label htmlFor="signup-email">Email</label>
                <input id="signup-email" type="email" name="email" autoComplete="email" placeholder="Enter your email" value={form.email} onChange={handleChange} required maxLength={254} disabled={isSubmitting} />
              </div>
              <div className="signup-input-group">
                <label htmlFor="signup-password">Password</label>
                <input id="signup-password" type="password" name="password" autoComplete="new-password" placeholder="Create a password" value={form.password} onChange={handleChange} required minLength={8} maxLength={128} disabled={isSubmitting} />
                <span className="auth-password-hint">At least 8 characters, with a letter and a number.</span>
              </div>
              <div className="signup-input-group">
                <label htmlFor="signup-confirm-password">Confirm Password</label>
                <input id="signup-confirm-password" type="password" name="passwordConfirm" autoComplete="new-password" placeholder="Confirm your password" value={form.passwordConfirm} onChange={handleChange} required maxLength={128} disabled={isSubmitting} />
              </div>

              {error && <p className="auth-feedback" role="alert">{error}</p>}
              <button type="submit" className="signup-button" disabled={isSubmitting}>
                {isSubmitting ? <><span className="auth-spinner" aria-hidden="true" /> CREATING ACCOUNT…</> : "CREATE ACCOUNT"}
              </button>
            </form>

            <p className="login-link">Already have an account? <Link to="/login">Sign In</Link></p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Signup;
