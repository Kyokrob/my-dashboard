import { useEffect } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import Dashboard from "./pages/Dashboard.jsx";
import Report from "./pages/Report.jsx";
import Trackers from "./pages/Trackers.jsx";
import Settings from "./pages/Settings.jsx";
import LatestActivity from "./pages/LatestActivity.jsx";
import NotFound from "./pages/NotFound.jsx";
import { DashboardProvider } from "./context/DashboardContext.jsx";
import { AuthProvider, useAuth } from "./context/AuthContext.jsx";
import Login from "./pages/Login.jsx";
import AppShell from "./components/layout/AppShell.jsx";

function RequireAuth({ children }) {
  const { user, loading, status } = useAuth();
  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#141821",
          color: "rgba(255,255,255,0.75)",
          fontSize: 13,
          gap: 10,
        }}
      >
        <div style={{ display: "grid", placeItems: "center", gap: 8 }}>
          <CircularProgress size={28} />
          <div>
            {status === "retrying" ? "Reconnecting to server..." : "Checking your session..."}
          </div>
        </div>
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
                <AppShell>
                  <Dashboard />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/trackers"
            element={
              <RequireAuth>
                <AppShell>
                  <Trackers />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/report"
            element={
              <RequireAuth>
                <AppShell>
                  <Report />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/activity"
            element={
              <RequireAuth>
                <AppShell>
                  <LatestActivity />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="/settings"
            element={
              <RequireAuth>
                <AppShell>
                  <Settings />
                </AppShell>
              </RequireAuth>
            }
          />
          <Route
            path="*"
            element={
              <RequireAuth>
                <AppShell>
                  <NotFound />
                </AppShell>
              </RequireAuth>
            }
          />
        </Routes>
      </DashboardProvider>
    </AuthProvider>
  );
}
