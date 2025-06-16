import { useState } from "react";

export const useToast = () => {
  const [toasts, setToasts] = useState([]);

  const showToast = (message, severity = "info", duration = 4000) => {
    const id = Date.now() + Math.random();
    const newToast = {
      id,
      message,
      severity,
      duration,
      open: true,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove toast after duration
    setTimeout(() => {
      removeToast(id);
    }, duration);

    return id;
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const success = (message, duration) =>
    showToast(message, "success", duration);
  const error = (message, duration) => showToast(message, "error", duration);
  const warning = (message, duration) =>
    showToast(message, "warning", duration);
  const info = (message, duration) => showToast(message, "info", duration);

  return {
    toasts,
    showToast,
    removeToast,
    success,
    error,
    warning,
    info,
  };
};
