import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

import ExpenseForm from "./ExpenseForm.jsx";

export default function ExpenseDialog({ open, onClose, onAdd }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        Add Expense
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <ExpenseForm
          onAdd={async (row) => {
            await onAdd?.(row);
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
