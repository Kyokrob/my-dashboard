import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";

export default function ConfirmDialog({
  open,
  title = "Confirm",
  description = "Are you sure?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onClose,
}) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent sx={{ opacity: 0.9 }}>{description}</DialogContent>
      <DialogActions>
        <Button onClick={onClose} variant="outlined">
          {cancelText}
        </Button>
        <Button onClick={onConfirm} variant="outlined" color="error">
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
