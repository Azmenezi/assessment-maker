import React from "react";
import { Snackbar, Alert, Slide } from "@mui/material";

function SlideTransition(props) {
  return <Slide {...props} direction="up" />;
}

export const ToastContainer = ({ toasts, onClose }) => {
  return (
    <>
      {toasts.map((toast, index) => (
        <Snackbar
          key={toast.id}
          open={toast.open}
          autoHideDuration={toast.duration}
          onClose={() => onClose(toast.id)}
          TransitionComponent={SlideTransition}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
          sx={{
            position: "fixed",
            bottom: 16 + index * 70, // Stack toasts vertically
            right: 16,
            zIndex: 9999,
          }}
        >
          <Alert
            onClose={() => onClose(toast.id)}
            severity={toast.severity}
            variant="filled"
            sx={{
              width: "100%",
              minWidth: 300,
              maxWidth: 500,
              boxShadow: 3,
            }}
          >
            {toast.message}
          </Alert>
        </Snackbar>
      ))}
    </>
  );
};
