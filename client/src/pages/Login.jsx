import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext";
import api from "../lib/api";
import { getAuthError } from "../lib/authError";
import "./Login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { establishSession } = useAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLogin = async (event) => {
    event.preventDefault();
    if (isSubmitting) return;
    if (!identifier.trim() || !password) {
      setError("Enter your email or username and password.");
      return;
    }

    setError("");
    setIsSubmitting(true);
    try {
      const response = await api.post("/auth/login", {
        identifier: identifier.trim(),
        password,
      });
      establishSession(response.data);
      const destination = location.state?.from?.pathname || "/dashboard";
      navigate(destination, { replace: true });
    } catch (requestError) {
      setError(getAuthError(requestError, "We couldn’t sign you in. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-background">
        <div className="background-overlay"></div>
        <div className="login-content">
          <div className="hero-section">
            <div className="brand">
              <span className="brand-icon" aria-hidden="true">✈</span>
              <span>SMARTSAFAR</span>
            </div>
            <div className="hero-text">
              <p className="small-title">TRAVEL • EXPLORE • DISCOVER</p>
              <h1>EXPLORE<br />HORIZONS</h1>
              <p className="hero-description">Where your dream destinations<br />become reality.</p>
              <p className="hero-subtitle">Embark on a journey where every corner<br />of the world is within your reach.</p>
            </div>
          </div>

          <div className="login-card">
            <div className="login-card-header">
              <div className="login-icon" aria-hidden="true">✈</div>
              <h2>Welcome Back</h2>
              <p>Continue your journey with SmartSafar</p>
            </div>

            <form onSubmit={handleLogin} aria-busy={isSubmitting} noValidate>
              <div className="input-group">
                <label htmlFor="login-identifier">Email or username</label>
                <input
                  id="login-identifier"
                  name="identifier"
                  type="text"
                  autoComplete="username"
                  placeholder="Enter your email or username"
                  value={identifier}
                  onChange={(event) => { setIdentifier(event.target.value); setError(""); }}
                  required
                  disabled={isSubmitting}
                />
              </div>
              <div className="input-group">
                <label htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(event) => { setPassword(event.target.value); setError(""); }}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {error && <p className="auth-feedback" role="alert">{error}</p>}
              <button type="submit" className="signin-button" disabled={isSubmitting}>
                {isSubmitting ? <><span className="auth-spinner" aria-hidden="true" /> SIGNING IN…</> : "SIGN IN"}
              </button>
            </form>

            <p className="signup-text">
              Are you new? <Link to="/signup">Create an Account</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
