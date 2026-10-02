import React from "react";
import {
  BrowserRouter as Router,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Dashboard from "./pages/Dashboard";
import Languages from "./pages/Languages";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Safety from "./pages/Safety";
import Signup from "./pages/Signup";
import DestinationDetails from "./pages/DestinationDetails";
import TripPlanner from "./pages/TripPlanner";
import Trips from "./pages/Trips";
import TripDetails from "./pages/TripDetails";
import Navbar from "./components/Navbar";
import { AuthProvider, useAuth } from "./auth/AuthContext";
import "./App.css";

function RequireAuth({ children }) {
  const { status, refreshSession, logout } = useAuth();
  const location = useLocation();

  if (status === "checking") {
    return <main className="auth-session-state" role="status">Restoring your SmartSafar session…</main>;
  }
  if (status === "unavailable") {
    return (
      <main className="auth-session-state">
        <section className="auth-session-card" role="alert">
          <h1>Can’t verify your session</h1>
          <p>SmartSafar could not reach the authentication service. Check that the API is running, then try again.</p>
          <button type="button" className="auth-session-retry" onClick={refreshSession}>Try again</button>
          <button type="button" className="auth-session-signout" onClick={logout}>Sign out</button>
        </section>
      </main>
    );
  }
  if (status !== "authenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return children;
}

function AppContent() {
  const location = useLocation();
  const { status } = useAuth();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/signup";

  return (
    <div className="min-h-screen">
      {status === "authenticated" && !isAuthPage && <Navbar />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<RequireAuth><Dashboard /></RequireAuth>} />
        <Route path="/destinations/:destinationId" element={<RequireAuth><DestinationDetails /></RequireAuth>} />
        <Route path="/planner" element={<RequireAuth><TripPlanner /></RequireAuth>} />
        <Route path="/trips" element={<RequireAuth><Trips /></RequireAuth>} />
        <Route path="/trips/:tripId" element={<RequireAuth><TripDetails /></RequireAuth>} />
        <Route path="/languages" element={<RequireAuth><Languages /></RequireAuth>} />
        <Route path="/safety" element={<RequireAuth><Safety /></RequireAuth>} />
        <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
