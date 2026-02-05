import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";
import LogoutIcon from "@mui/icons-material/Logout";

export default function FabSpeedDial({ onAddExpense, onAddWorkout, onLogout }) {
  return (
    <SpeedDial
      ariaLabel="Quick actions"
      sx={{ position: "fixed", bottom: 24, right: 24 }}
      icon={<AddIcon />}
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
