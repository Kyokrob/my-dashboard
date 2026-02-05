import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import DrinkForm from "./DrinkForm.jsx";

export default function DrinkDialog({ open, onClose, onSubmit, initial, onDelete }) {
  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        Log Drink
        <IconButton onClick={onClose} size="small">
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>

      <DialogContent dividers>
        <DrinkForm
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
