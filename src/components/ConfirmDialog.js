import React from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
} from "@mui/material";
import { Warning } from "@mui/icons-material";

export const ConfirmDialog = ({
  open,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Confirm",
  cancelText = "Cancel",
  severity = "warning", // warning, error, info
}) => {
  const getIcon = () => {
    switch (severity) {
      case "error":
        return <Warning color="error" sx={{ mr: 1 }} />;
      case "warning":
        return <Warning color="warning" sx={{ mr: 1 }} />;
      default:
        return <Warning color="action" sx={{ mr: 1 }} />;
    }
  };

  const getConfirmColor = () => {
    switch (severity) {
      case "error":
        return "error";
      case "warning":
        return "warning";
      default:
        return "primary";
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center">
          {getIcon()}
          {title}
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="body1">{message}</Typography>
      </DialogContent>
      <DialogActions sx={{ p: 2, gap: 1 }}>
        <Button onClick={onClose} variant="outlined" color="inherit">
          {cancelText}
        </Button>
        <Button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          variant="contained"
          color={getConfirmColor()}
        >
          {confirmText}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
