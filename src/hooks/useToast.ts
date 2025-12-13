import { toast, ToastOptions } from "react-hot-toast";

export const useToast = () => {
  const showToast = (
    message: string,
    type: "success" | "error" | "warning" | "info" = "info",
    options?: ToastOptions
  ) => {
    const defaultOptions: ToastOptions = {
      duration: 4000,
      position: "top-right",
      ...options,
    };

    switch (type) {
      case "success":
        return toast.success(message, defaultOptions);
      case "error":
        return toast.error(message, defaultOptions);
      case "warning":
        return toast(message, { ...defaultOptions, icon: "⚠️" });
      case "info":
        return toast(message, { ...defaultOptions, icon: "ℹ️" });
      default:
        return toast(message, defaultOptions);
    }
  };

  return {
    success: (message: string, options?: ToastOptions) => showToast(message, "success", options),
    error: (message: string, options?: ToastOptions) => showToast(message, "error", options),
    warning: (message: string, options?: ToastOptions) => showToast(message, "warning", options),
    info: (message: string, options?: ToastOptions) => showToast(message, "info", options),
  };
};

