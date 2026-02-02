import { Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard.jsx";
import Report from "./pages/Report.jsx";
import { DashboardProvider } from "./context/DashboardContext.jsx";

export default function App() {
  return (
    <DashboardProvider>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/report" element={<Report />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </DashboardProvider>
  );
}
