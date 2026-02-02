import SpeedDial from "@mui/material/SpeedDial";
import SpeedDialIcon from "@mui/material/SpeedDialIcon";
import SpeedDialAction from "@mui/material/SpeedDialAction";

import AddIcon from "@mui/icons-material/Add";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import FitnessCenterIcon from "@mui/icons-material/FitnessCenter";

export default function FabSpeedDial({ onAddExpense, onAddWorkout }) {
  const actions = [
    { icon: <ReceiptLongIcon />, name: "Add Expense", onClick: onAddExpense },
    { icon: <FitnessCenterIcon />, name: "Add Workout", onClick: onAddWorkout },
  ];

  return (
    <SpeedDial
      ariaLabel="Quick Actions"
      sx={{ position: "fixed", bottom: 22, right: 22 }}
      icon={<SpeedDialIcon icon={<AddIcon />} />}
    >
      {actions.map((a) => (
        <SpeedDialAction
          key={a.name}
          icon={a.icon}
          tooltipTitle={a.name}
          onClick={a.onClick}
        />
      ))}
    </SpeedDial>
  );
}
