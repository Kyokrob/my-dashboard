import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialAction from "@mui/material/SpeedDialAction";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";

export default function FabSpeedDial({ onAddExpense, onAddWorkout }) {
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
    </SpeedDial>
  );
}
