import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "../components/layout/DashboardLayout.jsx";
import SectionCard from "../components/common/SectionCard.jsx";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import TextField from "@mui/material/TextField";
import Switch from "@mui/material/Switch";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import IconButton from "@mui/material/IconButton";
import InputAdornment from "@mui/material/InputAdornment";
import ConfirmDialog from "../components/common/ConfirmDialog.jsx";
import { apiFetch } from "../api/apiFetch.js";
import { useDashboard } from "../context/DashboardContext.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import VisibilityIcon from "@mui/icons-material/Visibility";
import { inMonth } from "../utils/date.js";
import { budgetByCategory } from "../config/budget.js";
import { defaultWorkoutTypes, defaultWorkoutTypePrefs } from "../config/workouts.js";
import {
  defaultExpenseCategories,
  defaultDrinkReasons,
  defaultDrinkVenues,
} from "../config/preferences.js";
import "./Settings.scss";

export default function Settings() {
  const {
    monthKey,
    tier,
    setTier,
    budgets,
    setBudgets,
    workoutTypes,
    setWorkoutTypes,
    expenseCategories,
    setExpenseCategories,
    drinkReasons,
    setDrinkReasons,
    drinkVenues,
    setDrinkVenues,
  } = useDashboard();
  const { user, refresh, logout } = useAuth();
  const navigate = useNavigate();
  const backupKey = user?.id ? `backup:last:${user.id}` : "backup:last:anon";
  const [tab, setTab] = useState("profile");
  const [profileName, setProfileName] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [savingBudget, setSavingBudget] = useState(false);
  const [budgetForm, setBudgetForm] = useState(budgets || budgetByCategory);
  const [workoutForm, setWorkoutForm] = useState(() => {
    const raw = workoutTypes || defaultWorkoutTypePrefs;
    const cleaned = raw
      .map((w) =>
        typeof w === "string"
          ? { label: w, enabled: true }
          : { label: String(w?.label || "").trim(), enabled: w?.enabled !== false }
      )
      .filter((w) => w.label);
    return cleaned.length ? cleaned : defaultWorkoutTypePrefs;
  });
  const [newWorkout, setNewWorkout] = useState("");
  const [savingWorkouts, setSavingWorkouts] = useState(false);
  const [newBudgetCategory, setNewBudgetCategory] = useState("");
  const [prefCategories, setPrefCategories] = useState(
    expenseCategories || defaultExpenseCategories.map((label) => ({ label, enabled: true }))
  );
  const [prefReasons, setPrefReasons] = useState(
    drinkReasons || defaultDrinkReasons.map((label) => ({ label, enabled: true }))
  );
  const [prefVenues, setPrefVenues] = useState(
    drinkVenues || defaultDrinkVenues.map((label) => ({ label, enabled: true }))
  );
  const [newExpenseCategory, setNewExpenseCategory] = useState("");
  const [newDrinkReason, setNewDrinkReason] = useState("");
  const [newDrinkVenue, setNewDrinkVenue] = useState("");
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [confirmExpense, setConfirmExpense] = useState({ open: false, label: "" });
  const [confirmWorkout, setConfirmWorkout] = useState({ open: false, name: "" });
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteName, setInviteName] = useState("");
  const [inviteResult, setInviteResult] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userAction, setUserAction] = useState({ id: null, type: null });
  const [confirmUserAction, setConfirmUserAction] = useState({
    open: false,
    action: null,
    user: null,
  });
  const [exporting, setExporting] = useState(false);
  const [exportCsvLoading, setExportCsvLoading] = useState(false);
  const [exportScope, setExportScope] = useState("month");
  const [importing, setImporting] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [lastBackupAt, setLastBackupAt] = useState(null);
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [verifyPassword, setVerifyPassword] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [verifiedUntil, setVerifiedUntil] = useState(0);
  const [pendingAction, setPendingAction] = useState(null);
  const [pendingTab, setPendingTab] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: "", severity: "success" });
  const [budgetTierDraft, setBudgetTierDraft] = useState(tier || "low");

  useEffect(() => {
    setBudgetForm(budgets || budgetByCategory);
  }, [budgets]);

  useEffect(() => {
    setBudgetTierDraft(tier || "low");
  }, [tier]);

  useEffect(() => {
    const raw = workoutTypes || defaultWorkoutTypePrefs;
    const cleaned = raw
      .map((w) =>
        typeof w === "string"
          ? { label: w, enabled: true }
          : { label: String(w?.label || "").trim(), enabled: w?.enabled !== false }
      )
      .filter((w) => w.label);
    setWorkoutForm(cleaned.length ? cleaned : defaultWorkoutTypePrefs);
  }, [workoutTypes]);

  useEffect(() => {
    setPrefCategories(
      expenseCategories && expenseCategories.length
        ? expenseCategories
        : defaultExpenseCategories.map((label) => ({ label, enabled: true }))
    );
  }, [expenseCategories]);

  useEffect(() => {
    setPrefReasons(
      drinkReasons && drinkReasons.length
        ? drinkReasons
        : defaultDrinkReasons.map((label) => ({ label, enabled: true }))
    );
  }, [drinkReasons]);

  useEffect(() => {
    setPrefVenues(
      drinkVenues && drinkVenues.length
        ? drinkVenues
        : defaultDrinkVenues.map((label) => ({ label, enabled: true }))
    );
  }, [drinkVenues]);

  useEffect(() => {
    try {
      if (!user) return;
      const stored = localStorage.getItem(backupKey);
      setLastBackupAt(stored ? new Date(stored) : null);
    } catch {
      setLastBackupAt(null);
    }
  }, [backupKey, user]);

  useEffect(() => {
    const labels = prefCategories.map((c) => c.label);
    setBudgetForm((prev) => {
      const next = { ...prev };
      labels.forEach((label) => {
        if (!next[label]) next[label] = { low: 0, mid: 0, high: 0 };
      });
      return next;
    });
  }, [prefCategories]);

  useEffect(() => {
    setProfileName(user?.name || "");
  }, [user]);

  const breadcrumbLabel = useMemo(() => {
    if (tab === "profile") return "Profile";
    if (tab === "security") return "Security";
    if (tab === "workouts") return "Workouts";
    if (tab === "expense") return "Expense";
    if (tab === "drink") return "Drink";
    if (tab === "admin") return "Admin";
    return "Settings";
  }, [tab]);

  const expenseSubLabel = useMemo(() => {
    if (tab !== "expense") return "";
    return "Expense Categories / Budget";
  }, [tab]);

  function requireVerification(action, { force = false } = {}) {
    const now = Date.now();
    if (!force && verifiedUntil > now) {
      action();
      return;
    }
    setPendingAction(() => action);
    setVerifyOpen(true);
  }

  function parseAmount(value) {
    if (value === null || value === undefined) return 0;
    if (typeof value === "number") return Number.isFinite(value) ? value : 0;
    const cleaned = String(value).replace(/฿/g, "").replace(/,/g, "").trim();
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  }

  function csvEscape(value) {
    if (value === null || value === undefined) return "";
    const str = String(value);
    if (/[",\n]/.test(str)) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  }

  async function exportMonthlyCsv() {
    requireVerification(async () => {
      try {
        setExportCsvLoading(true);
        const [exp, wo, dr] = await Promise.all([
          apiFetch("/api/expenses"),
          apiFetch("/api/workouts"),
          apiFetch("/api/drinks"),
        ]);
        const expenses = Array.isArray(exp) ? exp : [];
        const workouts = Array.isArray(wo) ? wo : [];
        const drinks = Array.isArray(dr) ? dr : [];

        const addMonths = (key, offset) => {
          const [y, m] = key.split("-").map(Number);
          const d = new Date(y, m - 1 + offset, 1);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        };
        const monthKeys =
          exportScope === "3mo" ? [addMonths(monthKey, -2), addMonths(monthKey, -1), monthKey] : [monthKey];
        const withinRange = (date) => monthKeys.some((key) => inMonth(date, key));

        const monthExpenses = expenses.filter((e) => withinRange(e.date));
        const monthWorkouts = workouts.filter((w) => withinRange(w.date));
        const monthDrinkLogs = drinks.filter((d) => withinRange(d.date) && d.drank);
        const monthSpendTotal = monthExpenses.reduce((sum, e) => sum + parseAmount(e.amount), 0);

        const lines = [];
        lines.push("Monthly Summary");
        lines.push(`Range,${csvEscape(exportScope === "3mo" ? monthKeys.join(" | ") : monthKey)}`);
        lines.push(`Total expenses,${Math.round(monthSpendTotal)}`);
        lines.push(`Expense count,${monthExpenses.length}`);
        lines.push(`Workout count,${monthWorkouts.length}`);
        lines.push(`Drink log count,${monthDrinkLogs.length}`);
        lines.push("");
        lines.push("Expenses");
        lines.push("Date,Amount,Category,Subcategory,Type,Note");
        monthExpenses.forEach((e) => {
          lines.push(
            [
              csvEscape(e.date),
              Math.round(parseAmount(e.amount)),
              csvEscape(e.category || ""),
              csvEscape(e.subCategory || ""),
              csvEscape(e.type || ""),
              csvEscape(e.note || ""),
            ].join(",")
          );
        });
        lines.push("");
        lines.push("Workouts");
        lines.push("Date,Workout,Intensity,Feel,Weight,BodyFat,Note");
        monthWorkouts.forEach((w) => {
          lines.push(
            [
              csvEscape(w.date),
              csvEscape(w.workoutType || ""),
              csvEscape(w.intensity ?? ""),
              csvEscape(w.feel || ""),
              csvEscape(w.weight ?? ""),
              csvEscape(w.bodyFat ?? ""),
              csvEscape(w.note || ""),
            ].join(",")
          );
        });
        lines.push("");
        lines.push("Drink Logs");
        lines.push("Date,Name,Level,Duration,Reasons,Venue,Enjoyment,Regret,Repeat,Note");
        monthDrinkLogs.forEach((d) => {
          lines.push(
            [
              csvEscape(d.date),
              csvEscape(d.name || ""),
              csvEscape(d.level ?? ""),
              csvEscape(d.durationHours ?? ""),
              csvEscape((d.reasons || []).join("; ")),
              csvEscape(d.venue || ""),
              csvEscape(d.enjoyment ?? ""),
              csvEscape(d.regret || ""),
              csvEscape(d.wouldRepeat ?? ""),
              csvEscape(d.note || ""),
            ].join(",")
          );
        });

        const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        const scopeLabel = exportScope === "3mo" ? "3mo" : "month";
        link.download = `monthly-summary-${monthKey}-${scopeLabel}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        URL.revokeObjectURL(url);
        setSnack({ open: true, message: "CSV exported", severity: "success" });
      } catch (err) {
        setSnack({ open: true, message: err.message || "Failed to export CSV", severity: "error" });
      } finally {
        setExportCsvLoading(false);
      }
    }, { force: true });
  }

  async function verifyPasswordNow() {
    if (verifyPassword.length < 6) {
      setVerifyError("Password must be at least 6 characters");
      return;
    }
    try {
      setVerifyLoading(true);
      setVerifyError("");
      await apiFetch("/api/auth/verify-password", {
        method: "POST",
        body: JSON.stringify({ password: verifyPassword }),
      });
      setVerifyOpen(false);
      setVerifyPassword("");
      setVerifyError("");
      setVerifiedUntil(Date.now() + 1000 * 60 * 10);
      if (pendingAction) pendingAction();
      setPendingAction(null);
      if (pendingTab) {
        setTab(pendingTab);
        setPendingTab(null);
      }
    } catch (err) {
      setVerifyError(err.message || "Verification failed");
    } finally {
      setVerifyLoading(false);
    }
  }

  async function handleReset(e) {
    e.preventDefault();
    if (currentPassword.length < 6) {
      setSnack({ open: true, message: "Current password must be at least 6 characters", severity: "error" });
      return;
    }
    if (password.length < 6) {
      setSnack({ open: true, message: "Password must be at least 6 characters", severity: "error" });
      return;
    }
    if (password !== confirm) {
      setSnack({ open: true, message: "Passwords do not match", severity: "error" });
      return;
    }

    try {
      setLoading(true);
      await apiFetch("/api/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword: password }),
      });
      setCurrentPassword("");
      setPassword("");
      setConfirm("");
      setSnack({ open: true, message: "Password updated", severity: "success" });
    } catch (err) {
      setSnack({ open: true, message: err.message || "Failed to update password", severity: "error" });
    } finally {
      setLoading(false);
    }
  }

  async function saveProfile(e) {
    e.preventDefault();
    if (!profileName.trim()) {
      setSnack({ open: true, message: "Name is required", severity: "error" });
      return;
    }
    requireVerification(async () => {
      try {
        setSavingProfile(true);
        await apiFetch("/api/auth/profile", {
          method: "PATCH",
          body: JSON.stringify({ name: profileName.trim() }),
        });
        await refresh();
        setSnack({ open: true, message: "Profile updated", severity: "success" });
      } catch (err) {
        setSnack({ open: true, message: err.message || "Failed to update profile", severity: "error" });
      } finally {
        setSavingProfile(false);
      }
    });
  }

  function updateBudget(cat, tier, value) {
    setBudgetForm((prev) => ({
      ...prev,
      [cat]: {
        ...prev[cat],
        [tier]: Number(value || 0),
      },
    }));
  }

  const activeBudgetCategories = useMemo(
    () => (prefCategories || []).filter((c) => c.enabled !== false),
    [prefCategories]
  );

  const budgetTotals = useMemo(() => {
    const totals = { low: 0, mid: 0, high: 0 };
    activeBudgetCategories.forEach((c) => {
      const row = budgetForm?.[c.label] || {};
      totals.low += Number(row.low || 0);
      totals.mid += Number(row.mid || 0);
      totals.high += Number(row.high || 0);
    });
    return totals;
  }, [budgetForm, activeBudgetCategories]);

  function addBudgetCategory() {
    const label = newBudgetCategory.trim();
    if (!label) return;
    if (budgetForm[label]) {
      setSnack({ open: true, message: "Category already exists", severity: "error" });
      return;
    }
    setBudgetForm((prev) => ({
      ...prev,
      [label]: { low: 0, mid: 0, high: 0 },
    }));
    setNewBudgetCategory("");
  }

  function addExpenseCategory() {
    const label = newExpenseCategory.trim();
    if (!label) return;
    if (prefCategories.some((c) => c.label.toLowerCase() === label.toLowerCase())) {
      setSnack({ open: true, message: "Category already exists", severity: "error" });
      return;
    }
    setPrefCategories((prev) => [...prev, { label, enabled: true }]);
    setNewExpenseCategory("");
  }

  function addDrinkReason() {
    const label = newDrinkReason.trim();
    if (!label) return;
    if (prefReasons.some((r) => r.label.toLowerCase() === label.toLowerCase())) {
      setSnack({ open: true, message: "Reason already exists", severity: "error" });
      return;
    }
    setPrefReasons((prev) => [...prev, { label, enabled: true }]);
    setNewDrinkReason("");
  }

  function addDrinkVenue() {
    const label = newDrinkVenue.trim();
    if (!label) return;
    if (prefVenues.some((v) => v.label.toLowerCase() === label.toLowerCase())) {
      setSnack({ open: true, message: "Venue already exists", severity: "error" });
      return;
    }
    setPrefVenues((prev) => [...prev, { label, enabled: true }]);
    setNewDrinkVenue("");
  }

  const defaultExpenseSet = useMemo(
    () => new Set(defaultExpenseCategories.map((c) => c.toLowerCase())),
    []
  );
  const defaultReasonSet = useMemo(
    () => new Set(defaultDrinkReasons.map((c) => c.toLowerCase())),
    []
  );
  const defaultVenueSet = useMemo(
    () => new Set(defaultDrinkVenues.map((c) => c.toLowerCase())),
    []
  );
  const defaultWorkoutSet = useMemo(
    () => new Set(defaultWorkoutTypes.map((c) => c.toLowerCase())),
    []
  );

  function removeExpenseCategory(label) {
    if (defaultExpenseSet.has(label.toLowerCase())) return;
    setConfirmExpense({ open: true, label });
  }

  function confirmRemoveExpense() {
    const label = confirmExpense.label;
    setPrefCategories((prev) => prev.filter((c) => c.label !== label));
    setBudgetForm((prev) => {
      const next = { ...prev };
      delete next[label];
      return next;
    });
    setConfirmExpense({ open: false, label: "" });
  }

  function removeDrinkReason(label) {
    if (defaultReasonSet.has(label.toLowerCase())) return;
    setPrefReasons((prev) => prev.filter((c) => c.label !== label));
  }

  function removeDrinkVenue(label) {
    if (defaultVenueSet.has(label.toLowerCase())) return;
    setPrefVenues((prev) => prev.filter((c) => c.label !== label));
  }

  async function saveBudgets() {
    requireVerification(async () => {
      try {
        setSavingBudget(true);
        const payload = { budgets: budgetForm };
        const res = await apiFetch("/api/budgets", {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setBudgets(res?.budgets || budgetForm);
        setSnack({ open: true, message: "Budgets updated", severity: "success" });
      } catch (err) {
        setSnack({ open: true, message: err.message || "Failed to update budgets", severity: "error" });
      } finally {
        setSavingBudget(false);
      }
    });
  }

  function saveBudgetTier() {
    if (!budgetTierDraft) return;
    setTier(budgetTierDraft);
    setSnack({ open: true, message: "Budget type updated", severity: "success" });
  }

  function addWorkoutType() {
    const value = newWorkout.trim();
    if (!value) return;
    if (workoutForm.some((w) => w.label.toLowerCase() === value.toLowerCase())) {
      setSnack({ open: true, message: "Workout already exists", severity: "error" });
      return;
    }
    setWorkoutForm((prev) => [...prev, { label: value, enabled: true }]);
    setNewWorkout("");
  }

  function removeWorkoutType(name) {
    setConfirmWorkout({ open: true, name });
  }

  function confirmRemoveWorkout() {
    setWorkoutForm((prev) => prev.filter((w) => w.label !== confirmWorkout.name));
    setConfirmWorkout({ open: false, name: "" });
  }

  async function saveWorkoutTypes() {
    requireVerification(async () => {
      try {
        setSavingWorkouts(true);
        const payload = {
          workoutTypes: (workoutForm || [])
            .map((w) =>
              typeof w === "string"
                ? { label: w, enabled: true }
                : { label: String(w?.label || "").trim(), enabled: w?.enabled !== false }
            )
            .filter((w) => w.label),
        };
        const res = await apiFetch("/api/workout-types", {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        setWorkoutTypes(res?.workoutTypes || workoutForm);
        setSnack({ open: true, message: "Workout types updated", severity: "success" });
      } catch (err) {
        setSnack({ open: true, message: err.message || "Failed to update workouts", severity: "error" });
      } finally {
        setSavingWorkouts(false);
      }
    });
  }

  async function savePreferences() {
    requireVerification(async () => {
      try {
        setSavingPrefs(true);
        const res = await apiFetch("/api/preferences", {
          method: "PUT",
          body: JSON.stringify({
            expenseCategories: prefCategories,
            drinkReasons: prefReasons,
            drinkVenues: prefVenues,
          }),
        });
        setExpenseCategories(res?.expenseCategories || prefCategories);
        setDrinkReasons(res?.drinkReasons || prefReasons);
        setDrinkVenues(res?.drinkVenues || prefVenues);
        setSnack({ open: true, message: "Preferences updated", severity: "success" });
      } catch (err) {
        setSnack({ open: true, message: err.message || "Failed to update preferences", severity: "error" });
      } finally {
        setSavingPrefs(false);
      }
    });
  }

  async function inviteUser() {
    if (!inviteEmail.trim()) {
      setSnack({ open: true, message: "Email is required", severity: "error" });
      return;
    }
    requireVerification(async () => {
      try {
        setInviteLoading(true);
        const res = await apiFetch("/api/admin/invite", {
          method: "POST",
          body: JSON.stringify({ email: inviteEmail.trim(), name: inviteName.trim() || undefined }),
        });
        setInviteResult(res);
        setInviteEmail("");
        setInviteName("");
        setSnack({ open: true, message: "Invite created", severity: "success" });
      } catch (err) {
        setSnack({ open: true, message: err.message || "Failed to invite user", severity: "error" });
      } finally {
        setInviteLoading(false);
      }
    }, { force: true });
  }

  async function loadUsers() {
    try {
      setUsersLoading(true);
      const res = await apiFetch("/api/admin/users");
      setUsers(res?.users || []);
    } catch (err) {
      setSnack({ open: true, message: err.message || "Failed to load users", severity: "error" });
    } finally {
      setUsersLoading(false);
    }
  }

  async function copyTempPassword() {
    if (!inviteResult?.tempPassword) return;
    try {
      await navigator.clipboard.writeText(inviteResult.tempPassword);
      setSnack({ open: true, message: "Temp password copied", severity: "success" });
    } catch {
      setSnack({ open: true, message: "Copy failed", severity: "error" });
    }
  }

  async function updateUserStatus(userId, isActive) {
    requireVerification(async () => {
      try {
        setUserAction({ id: userId, type: "status" });
        const res = await apiFetch(`/api/admin/users/${userId}/status`, {
          method: "PATCH",
          body: JSON.stringify({ isActive }),
        });
        const updated = res?.user;
        if (updated) {
          setUsers((prev) => prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)));
        }
        setSnack({
          open: true,
          message: isActive ? "User reactivated" : "User deactivated",
          severity: "success",
        });
      } catch (err) {
        setSnack({ open: true, message: err.message || "Failed to update user", severity: "error" });
      } finally {
        setUserAction({ id: null, type: null });
      }
    }, { force: true });
  }

  async function deleteUser(userId) {
    requireVerification(async () => {
      try {
        setUserAction({ id: userId, type: "delete" });
        await apiFetch(`/api/admin/users/${userId}`, { method: "DELETE" });
        setUsers((prev) => prev.filter((u) => u.id !== userId));
        setSnack({ open: true, message: "User deleted", severity: "success" });
      } catch (err) {
        setSnack({ open: true, message: err.message || "Failed to delete user", severity: "error" });
      } finally {
        setUserAction({ id: null, type: null });
      }
    }, { force: true });
  }

  function confirmUserActionNow() {
    const { action, user: target } = confirmUserAction;
    setConfirmUserAction({ open: false, action: null, user: null });
    if (!target) return;
    if (action === "deactivate") return updateUserStatus(target.id, false);
    if (action === "activate") return updateUserStatus(target.id, true);
    if (action === "delete") return deleteUser(target.id);
  }

  useEffect(() => {
    if (tab === "admin") {
      loadUsers();
    }
  }, [tab]);

  async function exportData() {
    try {
      setExporting(true);
      const data = await apiFetch("/api/data/export");
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      const date = new Date().toISOString().slice(0, 10);
      link.href = url;
      link.download = `admin-backup-${date}.json`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      try {
        const now = new Date().toISOString();
        localStorage.setItem(backupKey, now);
        setLastBackupAt(new Date(now));
      } catch {
        // ignore storage issues
      }
    } catch (err) {
      setSnack({ open: true, message: err.message || "Failed to export data", severity: "error" });
    } finally {
      setExporting(false);
    }
  }

  async function importData(file) {
    if (!file) return;
    requireVerification(async () => {
      try {
        setImporting(true);
        const text = await file.text();
        const parsed = JSON.parse(text);
        await apiFetch("/api/data/import", {
          method: "POST",
          body: JSON.stringify({ mode: "overwrite", data: parsed }),
        });
        setSnack({ open: true, message: "Import complete", severity: "success" });
      } catch (err) {
        setSnack({ open: true, message: err.message || "Failed to import data", severity: "error" });
      } finally {
        setImporting(false);
      }
    }, { force: true });
  }

  async function claimLegacyData() {
    requireVerification(async () => {
      try {
        setClaiming(true);
        const res = await apiFetch("/api/admin/claim-legacy", { method: "POST" });
        setSnack({
          open: true,
          message: `Claimed data · ${res.expensesUpdated || 0} expenses, ${res.workoutsUpdated || 0} workouts`,
          severity: "success",
        });
      } catch (err) {
        setSnack({ open: true, message: err.message || "Failed to claim data", severity: "error" });
      } finally {
        setClaiming(false);
      }
    }, { force: true });
  }

  async function fixDrinkIndex() {
    requireVerification(async () => {
      try {
        setClaiming(true);
        const res = await apiFetch("/api/admin/fix-drink-index", { method: "POST" });
        setSnack({
          open: true,
          message: res.droppedLegacy
            ? "Fixed drink index (legacy index removed)"
            : "Drink index is already correct",
          severity: "success",
        });
      } catch (err) {
        setSnack({ open: true, message: err.message || "Failed to fix drink index", severity: "error" });
      } finally {
        setClaiming(false);
      }
    }, { force: true });
  }

  function replayDashboardTour() {
    try {
      localStorage.removeItem(`tour:dashboard:${user?.id || "anon"}`);
    } catch {
      // ignore
    }
    navigate("/");
  }

  return (
    <DashboardLayout title="Settings">
      <div className="settings-head">
        <Breadcrumbs aria-label="breadcrumb" className="settings-breadcrumbs">
          <span>Settings</span>
          <span>{breadcrumbLabel}</span>
        </Breadcrumbs>
        <Tabs
          value={tab}
          onChange={(e, v) => {
            if (v === "admin") {
              setPendingTab("admin");
              requireVerification(() => {}, { force: true });
              return;
            }
            setTab(v);
          }}
          className="settings-tabs"
          textColor="inherit"
          indicatorColor="secondary"
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
        >
          <Tab value="profile" label="Profile" />
          <Tab value="workouts" label="Workouts" />
          <Tab value="expense" label="Expense" />
          <Tab value="drink" label="Drink" />
          <Tab value="security" label="Security" />
          {user?.role === "admin" && <Tab value="admin" label="Admin" />}
        </Tabs>
      </div>

      <div className="dashboard-full settings-stack">
        {tab === "profile" ? (
          <>
            <SectionCard title="Profile">
              <form className="settings-form" onSubmit={saveProfile}>
                <label className="settings-form__label" htmlFor="profile-name">
                  Name
                </label>
                <input
                  id="profile-name"
                  className="settings-form__input"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Your name"
                  required
                />

                <div className="settings-form__actions">
                  <Button type="submit" variant="contained" disabled={savingProfile}>
                    {savingProfile ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </form>
            </SectionCard>

            <SectionCard title="Onboarding Tour">
              <div className="settings-form__row-inline">
                <div className="settings-form__helper">
                  Need a refresher? Restart the guided tour anytime.
                </div>
                <Button variant="outlined" onClick={replayDashboardTour}>
                  Replay Tour
                </Button>
              </div>
            </SectionCard>

            <SectionCard title="Monthly Export">
              <div className="settings-form__row-inline">
                <div className="settings-form__helper">
                  Export a CSV of your activity. Password confirmation required.
                </div>
                <div className="settings-export__toggle">
                  <button
                    type="button"
                    className={`settings-export__btn ${exportScope === "month" ? "is-active" : ""}`}
                    onClick={() => setExportScope("month")}
                  >
                    This month
                  </button>
                  <button
                    type="button"
                    className={`settings-export__btn ${exportScope === "3mo" ? "is-active" : ""}`}
                    onClick={() => setExportScope("3mo")}
                  >
                    Last 3 months
                  </button>
                </div>
                <Button variant="outlined" onClick={exportMonthlyCsv} disabled={exportCsvLoading}>
                  {exportCsvLoading ? "Exporting..." : "Export CSV"}
                </Button>
              </div>
            </SectionCard>

            {user?.role === "admin" && (
              <SectionCard title="Export / Import">
                <div className="admin-tools__note">
                  {lastBackupAt
                    ? `Last backup ${lastBackupAt.toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}`
                    : "No backup yet. Export a JSON backup to keep your data safe."}
                </div>
                <div className="admin-tools__row">
                  <Button variant="outlined" onClick={exportData} disabled={exporting}>
                    {exporting ? "Exporting..." : "Export JSON"}
                  </Button>
                  <label className="admin-tools__file">
                    <input
                      type="file"
                      accept="application/json"
                      onChange={(e) => importData(e.target.files?.[0])}
                      disabled={importing}
                    />
                    <span>{importing ? "Importing..." : "Import JSON"}</span>
                  </label>
                </div>
                <div className="admin-tools__note">
                  Import will overwrite existing data for this account.
                </div>
              </SectionCard>
            )}
          </>
        ) : tab === "security" ? (
          <SectionCard title="Security">
            <form className="settings-form" onSubmit={handleReset}>
              <label className="settings-form__label" htmlFor="current-password">
                Current Password
              </label>
              <TextField
                id="current-password"
                type={showCurrentPassword ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="••••••••"
                required
                size="small"
                fullWidth
                sx={{
                  "& .MuiInputBase-root": {
                    color: "#fff",
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: "10px",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.12)",
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowCurrentPassword((prev) => !prev)}
                        edge="end"
                        size="small"
                      >
                        {showCurrentPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <label className="settings-form__label" htmlFor="new-password">
                New Password
              </label>
              <TextField
                id="new-password"
                type={showNewPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                size="small"
                fullWidth
                sx={{
                  "& .MuiInputBase-root": {
                    color: "#fff",
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: "10px",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.12)",
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowNewPassword((prev) => !prev)}
                        edge="end"
                        size="small"
                      >
                        {showNewPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <label className="settings-form__label" htmlFor="confirm-password">
                Confirm Password
              </label>
              <TextField
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••"
                required
                size="small"
                fullWidth
                sx={{
                  "& .MuiInputBase-root": {
                    color: "#fff",
                    background: "rgba(255,255,255,0.06)",
                    borderRadius: "10px",
                  },
                  "& .MuiOutlinedInput-notchedOutline": {
                    borderColor: "rgba(255,255,255,0.12)",
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton
                        onClick={() => setShowConfirmPassword((prev) => !prev)}
                        edge="end"
                        size="small"
                      >
                        {showConfirmPassword ? <VisibilityOffIcon /> : <VisibilityIcon />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <div className="settings-form__actions">
                <Button type="submit" variant="contained" disabled={loading}>
                  {loading ? "Updating..." : "Reset Password"}
                </Button>
              </div>
            </form>
          </SectionCard>
        ) : tab === "workouts" ? (
          <SectionCard title="Workout Types">
            <div className="workout-types">
              <div className="workout-types__add">
                <TextField
                  value={newWorkout}
                  onChange={(e) => setNewWorkout(e.target.value)}
                  size="small"
                  placeholder="Add workout type"
                  sx={{
                    flex: 1,
                    "& .MuiInputBase-root": {
                      color: "#fff",
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: "10px",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.12)",
                    },
                  }}
                />
                <Button variant="contained" onClick={addWorkoutType}>
                  Add
                </Button>
              </div>
              <div className="workout-types__list">
                {workoutForm.map((w) => {
                  const label = typeof w === "string" ? w : w.label;
                  const enabled = typeof w === "string" ? true : w.enabled !== false;
                  const isDefault = defaultWorkoutSet.has(label.toLowerCase());
                  return (
                  <div key={label} className="workout-types__item">
                    <span>{label}</span>
                    <div className="workout-types__actions">
                      <Switch
                        checked={enabled}
                        onChange={(e) =>
                          setWorkoutForm((prev) =>
                            prev.map((item) =>
                              (typeof item === "string" ? item === label : item.label === label)
                                ? { label, enabled: e.target.checked }
                                : item
                            )
                          )
                        }
                      />
                      <Button
                        size="small"
                        color="error"
                        disabled={isDefault}
                        onClick={() => removeWorkoutType(label)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                );
                })}
              </div>
              <div className="settings-form__actions">
                <Button variant="contained" onClick={saveWorkoutTypes} disabled={savingWorkouts}>
                  {savingWorkouts ? "Saving..." : "Save Workouts"}
                </Button>
              </div>
            </div>
          </SectionCard>
        ) : tab === "expense" ? (
          <>
            <div className="settings-subhead">
              <div>Settings / Expense</div>
              <div className="settings-subhead__muted">{expenseSubLabel}</div>
            </div>
            <SectionCard title="Expense Categories">
              <div className="settings-form__row-inline">
                <TextField
                  value={newExpenseCategory}
                  onChange={(e) => setNewExpenseCategory(e.target.value)}
                  size="small"
                  placeholder="New category"
                  sx={{
                    flex: 1,
                    "& .MuiInputBase-root": {
                      color: "#fff",
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: "10px",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.12)",
                    },
                  }}
                />
                <Button variant="contained" onClick={addExpenseCategory}>
                  Add
                </Button>
              </div>
              <div className="prefs-grid">
                {prefCategories.map((c) => (
                  <div className="prefs-row" key={c.label}>
                    <div>{c.label}</div>
                    <div className="prefs-row__actions">
                      <Switch
                        checked={c.enabled !== false}
                        onChange={(e) =>
                          setPrefCategories((prev) =>
                            prev.map((item) =>
                              item.label === c.label ? { ...item, enabled: e.target.checked } : item
                            )
                          )
                        }
                      />
                      <Button
                        size="small"
                        color="error"
                        disabled={defaultExpenseSet.has(c.label.toLowerCase())}
                        onClick={() => removeExpenseCategory(c.label)}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="settings-form__actions">
                <Button variant="contained" onClick={savePreferences} disabled={savingPrefs}>
                  {savingPrefs ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </SectionCard>
            <SectionCard title="Budget">
              <div className="settings-form__row-inline">
                <div className="settings-form__helper">
                  Choose your default budget type to use across the dashboard.
                </div>
                <div className="settings-export__toggle">
                  <button
                    type="button"
                    className={`settings-export__btn ${budgetTierDraft === "low" ? "is-active" : ""}`}
                    onClick={() => setBudgetTierDraft("low")}
                  >
                    Low
                  </button>
                  <button
                    type="button"
                    className={`settings-export__btn ${budgetTierDraft === "mid" ? "is-active" : ""}`}
                    onClick={() => setBudgetTierDraft("mid")}
                  >
                    Mid
                  </button>
                  <button
                    type="button"
                    className={`settings-export__btn ${budgetTierDraft === "high" ? "is-active" : ""}`}
                    onClick={() => setBudgetTierDraft("high")}
                  >
                    High
                  </button>
                </div>
                <Button variant="outlined" onClick={saveBudgetTier}>
                  Save Default
                </Button>
              </div>
              <div className="budget-table">
                <div className="budget-table__head">
                  <div>Category</div>
                  <div className="right">Low</div>
                  <div className="right">Mid</div>
                  <div className="right">High</div>
                </div>
                {activeBudgetCategories.map((c) => (
                  <div className="budget-table__row" key={c.label}>
                    <div>{c.label}</div>
                    {["low", "mid", "high"].map((tierKey) => (
                      <div className="right" key={`${c.label}-${tierKey}`}>
                        <TextField
                          value={budgetForm?.[c.label]?.[tierKey] ?? 0}
                          onChange={(e) => updateBudget(c.label, tierKey, e.target.value)}
                          size="small"
                          type="number"
                          inputProps={{ min: 0 }}
                          sx={{
                            "& .MuiInputBase-root": {
                              color: "#fff",
                              background: "rgba(255,255,255,0.06)",
                              borderRadius: "10px",
                            },
                            "& .MuiOutlinedInput-notchedOutline": {
                              borderColor: "rgba(255,255,255,0.12)",
                            },
                          }}
                        />
                      </div>
                    ))}
                  </div>
                ))}
                <div className="budget-table__row budget-table__row--total">
                  <div>Total</div>
                  <div className="right">฿{Math.round(budgetTotals.low).toLocaleString()}</div>
                  <div className="right">฿{Math.round(budgetTotals.mid).toLocaleString()}</div>
                  <div className="right">฿{Math.round(budgetTotals.high).toLocaleString()}</div>
                </div>
              </div>
              <div className="settings-form__actions">
                <Button variant="contained" onClick={saveBudgets} disabled={savingBudget}>
                  {savingBudget ? "Saving..." : "Save Budgets"}
                </Button>
              </div>
            </SectionCard>
          </>
        ) : tab === "drink" ? (
          <>
            <SectionCard title="Drink Reasons">
              <div className="settings-form__row-inline">
                <TextField
                  value={newDrinkReason}
                  onChange={(e) => setNewDrinkReason(e.target.value)}
                  size="small"
                  placeholder="New reason"
                  sx={{
                    flex: 1,
                    "& .MuiInputBase-root": {
                      color: "#fff",
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: "10px",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.12)",
                    },
                  }}
                />
                <Button variant="contained" onClick={addDrinkReason}>
                  Add
                </Button>
              </div>
              <div className="prefs-grid">
              {prefReasons.map((r) => (
                <div className="prefs-row" key={r.label}>
                  <div>{r.label}</div>
                  <div className="prefs-row__actions">
                    <Switch
                      checked={r.enabled !== false}
                      onChange={(e) =>
                        setPrefReasons((prev) =>
                          prev.map((item) =>
                            item.label === r.label ? { ...item, enabled: e.target.checked } : item
                          )
                        )
                      }
                    />
                    <Button
                      size="small"
                      color="error"
                      disabled={defaultReasonSet.has(r.label.toLowerCase())}
                      onClick={() => removeDrinkReason(r.label)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              </div>
            </SectionCard>
            <SectionCard title="Drink Venues">
              <div className="settings-form__row-inline">
                <TextField
                  value={newDrinkVenue}
                  onChange={(e) => setNewDrinkVenue(e.target.value)}
                  size="small"
                  placeholder="New venue"
                  sx={{
                    flex: 1,
                    "& .MuiInputBase-root": {
                      color: "#fff",
                      background: "rgba(255,255,255,0.06)",
                      borderRadius: "10px",
                    },
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "rgba(255,255,255,0.12)",
                    },
                  }}
                />
                <Button variant="contained" onClick={addDrinkVenue}>
                  Add
                </Button>
              </div>
              <div className="prefs-grid">
              {prefVenues.map((v) => (
                <div className="prefs-row" key={v.label}>
                  <div>{v.label}</div>
                  <div className="prefs-row__actions">
                    <Switch
                      checked={v.enabled !== false}
                      onChange={(e) =>
                        setPrefVenues((prev) =>
                          prev.map((item) =>
                            item.label === v.label ? { ...item, enabled: e.target.checked } : item
                          )
                        )
                      }
                    />
                    <Button
                      size="small"
                      color="error"
                      disabled={defaultVenueSet.has(v.label.toLowerCase())}
                      onClick={() => removeDrinkVenue(v.label)}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
              </div>
              <div className="settings-form__actions">
                <Button variant="contained" onClick={savePreferences} disabled={savingPrefs}>
                  {savingPrefs ? "Saving..." : "Save Preferences"}
                </Button>
              </div>
            </SectionCard>
          </>
        ) : (
          <SectionCard title="Admin Tools">
            <div className="admin-tools">
              <div className="admin-tools__section">
                <div className="admin-tools__title">Invite User</div>
                <div className="admin-tools__row">
                  <TextField
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    size="small"
                    placeholder="Email"
                    sx={{
                      flex: 1,
                      "& .MuiInputBase-root": {
                        color: "#fff",
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: "10px",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255,255,255,0.12)",
                      },
                    }}
                  />
                  <TextField
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    size="small"
                    placeholder="Name (optional)"
                    sx={{
                      flex: 1,
                      "& .MuiInputBase-root": {
                        color: "#fff",
                        background: "rgba(255,255,255,0.06)",
                        borderRadius: "10px",
                      },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: "rgba(255,255,255,0.12)",
                      },
                    }}
                  />
                  <Button variant="contained" onClick={inviteUser} disabled={inviteLoading}>
                    {inviteLoading ? "Inviting..." : "Invite"}
                  </Button>
                </div>
                {inviteResult && (
                  <div className="admin-tools__note admin-tools__note--row">
                    <span>
                      Temp password for {inviteResult.user?.email}:{" "}
                      <strong>{inviteResult.tempPassword}</strong>
                    </span>
                    <Button size="small" variant="outlined" onClick={copyTempPassword}>
                      Copy
                    </Button>
                  </div>
                )}
              </div>

              <div className="admin-tools__section">
                <div className="admin-tools__title">Users</div>
                <div className="admin-tools__row">
                  <Button variant="outlined" onClick={loadUsers} disabled={usersLoading}>
                    {usersLoading ? "Loading..." : "Refresh Users"}
                  </Button>
                </div>
                <div className="users-table">
                  <div className="users-table__head">
                    <div>Name</div>
                    <div>Email</div>
                    <div>Role</div>
                    <div>Status</div>
                    <div>Created</div>
                    <div>Actions</div>
                  </div>
                  {users.length ? (
                    users.map((u) => {
                      const isSelf = u.id === user?.id;
                      const isAdmin = u.role === "admin";
                      const disableActions = isSelf || isAdmin || userAction.id === u.id;
                      return (
                        <div className="users-table__row" key={u.id}>
                          <div>{u.name || "-"}</div>
                          <div>{u.email}</div>
                          <div>{u.role}</div>
                          <div>{u.isActive ? "Active" : "Disabled"}</div>
                          <div>
                            {u.createdAt
                              ? new Date(u.createdAt).toLocaleDateString("en-US", {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                })
                              : "-"}
                          </div>
                          <div className="users-table__actions">
                            <Button
                              size="small"
                              variant="outlined"
                              disabled={disableActions}
                              onClick={() =>
                                setConfirmUserAction({
                                  open: true,
                                  action: u.isActive ? "deactivate" : "activate",
                                  user: u,
                                })
                              }
                            >
                              {u.isActive ? "Deactivate" : "Activate"}
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              disabled={disableActions}
                              onClick={() => setConfirmUserAction({ open: true, action: "delete", user: u })}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="users-table__empty">
                      {usersLoading ? "Loading users..." : "No users yet"}
                    </div>
                  )}
                </div>
              </div>

              <div className="admin-tools__section">
                <div className="admin-tools__title">Claim Legacy Data</div>
                <div className="admin-tools__row">
                  <Button variant="outlined" onClick={claimLegacyData} disabled={claiming}>
                    {claiming ? "Claiming..." : "Claim Existing Data"}
                  </Button>
                  <Button variant="outlined" onClick={fixDrinkIndex} disabled={claiming}>
                    Fix Drink Index
                  </Button>
                </div>
                <div className="admin-tools__note">
                  Run once to attach old data to your admin account after multi-user update.
                </div>
              </div>
            </div>
          </SectionCard>
        )}
      </div>

      <Snackbar
        open={snack.open}
        autoHideDuration={2200}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        sx={{ bottom: 24 }}
        onClose={(e, reason) => {
          if (reason === "clickaway") return;
          setSnack((s) => ({ ...s, open: false }));
        }}
      >
        <Alert
          severity={snack.severity}
          variant="filled"
          onClose={() => setSnack((s) => ({ ...s, open: false }))}
          sx={{ fontSize: 13 }}
        >
          {snack.message}
        </Alert>
      </Snackbar>

      <Dialog
        open={verifyOpen}
        onClose={() => {
          setVerifyOpen(false);
          setVerifyPassword("");
          setVerifyError("");
          setPendingAction(null);
          setPendingTab(null);
        }}
        PaperProps={{ style: { background: "#161A23", borderRadius: 14, padding: 4 } }}
      >
        <DialogTitle>Confirm Password</DialogTitle>
        <DialogContent>
          <div style={{ display: "grid", gap: 8, minWidth: 280 }}>
            <input
              type="password"
              value={verifyPassword}
              onChange={(e) => setVerifyPassword(e.target.value)}
              placeholder="••••••••"
              style={{
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: 10,
                padding: "10px 12px",
                color: "#fff",
                fontSize: 14,
              }}
            />
            {verifyError ? (
              <div style={{ fontSize: 12, color: "#E3A6A1" }}>{verifyError}</div>
            ) : null}
          </div>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setVerifyOpen(false);
              setVerifyPassword("");
              setVerifyError("");
              setPendingAction(null);
              setPendingTab(null);
            }}
          >
            Cancel
          </Button>
          <Button variant="contained" onClick={verifyPasswordNow} disabled={verifyLoading}>
            {verifyLoading ? "Checking..." : "Continue"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={confirmWorkout.open}
        onClose={() => setConfirmWorkout({ open: false, name: "" })}
        PaperProps={{ style: { background: "#161A23", borderRadius: 14, padding: 4 } }}
      >
        <DialogTitle>Remove workout type</DialogTitle>
        <DialogContent>
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            Are you sure you want to remove "{confirmWorkout.name}"?
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmWorkout({ open: false, name: "" })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmRemoveWorkout}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={confirmUserAction.open}
        title={
          confirmUserAction.action === "delete"
            ? "Delete account?"
            : confirmUserAction.action === "deactivate"
            ? "Deactivate account?"
            : "Activate account?"
        }
        description={
          confirmUserAction.action === "delete"
            ? "This will permanently remove the user and all of their data."
            : confirmUserAction.action === "deactivate"
            ? "The user will be unable to sign in until reactivated."
            : "The user will be able to sign in again."
        }
        confirmText={confirmUserAction.action === "delete" ? "Delete" : "Confirm"}
        onConfirm={confirmUserActionNow}
        onClose={() => setConfirmUserAction({ open: false, action: null, user: null })}
      />

      <Dialog
        open={confirmExpense.open}
        onClose={() => setConfirmExpense({ open: false, label: "" })}
        PaperProps={{ style: { background: "#161A23", borderRadius: 14, padding: 4 } }}
      >
        <DialogTitle>Remove expense category</DialogTitle>
        <DialogContent>
          <div style={{ fontSize: 13, opacity: 0.8 }}>
            Are you sure you want to remove "{confirmExpense.label}"?
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmExpense({ open: false, label: "" })}>Cancel</Button>
          <Button variant="contained" color="error" onClick={confirmRemoveExpense}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </DashboardLayout>
  );
}
