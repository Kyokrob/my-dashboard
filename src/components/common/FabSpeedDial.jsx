import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import RemoveIcon from "@mui/icons-material/Remove";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import LogoutIcon from "@mui/icons-material/Logout";
import LocalBarIcon from "@mui/icons-material/LocalBar";

const KIcon = () => (
  <div
    style={{
      width: 40,
      height: 40,
      borderRadius: "50%",
      display: "grid",
      placeItems: "center",
      fontWeight: 700,
      fontSize: 24,
      letterSpacing: 0.5,
      color: "rgba(255, 255, 255, 1)",
    }}
  >
    K
  </div>
);

export default function FabSpeedDial({ onAddExpense, onAddWorkout, onAddDrink, onLogout }) {
  return (
    <SpeedDial
      ariaLabel="Quick actions"
      sx={{
        position: "fixed",
        bottom: 24,
        right: 24,
        "& .MuiFab-root": {
          border: "1px solid rgba(255,255,255,0.18)",
          boxShadow: "0 10px 24px rgba(0,0,0,0.35)",
        },
      }}
      icon={<KIcon />}
      openIcon={<RemoveIcon />}
    >
      <SpeedDialAction
        icon={<ReceiptLongIcon />}
        tooltipTitle="Add Expense"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAddExpense?.();
        }}
      />

      <SpeedDialAction
        icon={<FitnessCenterIcon />}
        tooltipTitle="Add Workout"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAddWorkout?.();
        }}
      />

      <SpeedDialAction
        icon={<LocalBarIcon />}
        tooltipTitle="Log Drink"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onAddDrink?.();
        }}
      />

      <SpeedDialAction
        icon={<LogoutIcon />}
        tooltipTitle="Logout"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onLogout?.();
        }}
      />
    </SpeedDial>
  );
}
