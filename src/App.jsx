import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import Dashboard from "./pages/Dashboard.jsx";
import Report from "./pages/Report.jsx";
import { DashboardProvider } from "./context/DashboardContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";

function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#141821",
        }}
      >
        <CircularProgress />
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [pathname]);
  return null;
}

export default function App() {
  return (
    <AuthProvider>
      <DashboardProvider>
        <ScrollToTop />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <RequireAuth>
                <Dashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/report"
            element={
              <RequireAuth>
                <Report />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </DashboardProvider>
    </AuthProvider>
  );
}
