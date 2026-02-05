import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";

import WorkoutForm from "./WorkoutForm.jsx";

export default function WorkoutDialog({ open, onClose, onSubmit, initial, onDelete }) {
  const isEdit = Boolean(initial?.id);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
      >
        {isEdit ? "Edit Workout" : "Add Workout"}
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <WorkoutForm
          initial={initial}
          onDelete={onDelete}
          onSubmit={async (row) => {
            await onSubmit?.(row);
            onClose();
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
