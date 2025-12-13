import { Toaster } from "react-hot-toast";

export default function ToastContainer() {
  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: "toast-notification",
        style: {
          background: "#ffffff",
          color: "#1f2937",
          borderRadius: "0.5rem",
          padding: "14px 18px",
          fontSize: "15px",
          fontWeight: "500",
          boxShadow: "0 10px 15px -3px rgb(0 0 0 / 0.2), 0 4px 6px -2px rgb(0 0 0 / 0.1)",
          border: "1px solid #e5e7eb",
          minWidth: "320px",
          maxWidth: "420px",
        },
        success: {
          className: "toast-success",
          style: {
            background: "#f0fdf4",
            color: "#166534",
            border: "2px solid #22c55e",
            fontWeight: "600",
          },
          iconTheme: {
            primary: "#22c55e",
            secondary: "#ffffff",
          },
        },
        error: {
          className: "toast-error",
          style: {
            background: "#fef2f2",
            color: "#991b1b",
            border: "2px solid #ef4444",
            fontWeight: "600",
          },
          iconTheme: {
            primary: "#ef4444",
            secondary: "#ffffff",
          },
        },
        warning: {
          className: "toast-warning",
          style: {
            background: "#fffbeb",
            color: "#92400e",
            border: "2px solid #f59e0b",
            fontWeight: "600",
          },
          iconTheme: {
            primary: "#f59e0b",
            secondary: "#ffffff",
          },
        },
        info: {
          className: "toast-info",
          style: {
            background: "#eff6ff",
            color: "#1e40af",
            border: "2px solid #3b82f6",
            fontWeight: "600",
          },
          iconTheme: {
            primary: "#3b82f6",
            secondary: "#ffffff",
          },
        },
      }}
      containerStyle={{
        top: 20,
        right: 20,
      }}
    />
  );
}

