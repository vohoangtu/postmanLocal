import { Loader2, CheckCircle2, XCircle } from "lucide-react";

type RequestStatus = "idle" | "sending" | "success" | "error";

interface RequestStatusProps {
  status: RequestStatus;
  className?: string;
}

export default function RequestStatus({ status, className = "" }: RequestStatusProps) {
  const statusConfig = {
    idle: {
      icon: null,
      text: "",
      color: "text-gray-500 dark:text-gray-400",
    },
    sending: {
      icon: Loader2,
      text: "Sending...",
      color: "text-blue-600 dark:text-blue-400",
    },
    success: {
      icon: CheckCircle2,
      text: "Success",
      color: "text-green-600 dark:text-green-400",
    },
    error: {
      icon: XCircle,
      text: "Error",
      color: "text-red-600 dark:text-red-400",
    },
  };

  const config = statusConfig[status];
  const Icon = config.icon;

  // Don't render anything when idle
  if (status === "idle") return null;

  return (
    <div className={`flex items-center gap-2 ${config.color} ${className}`}>
      {Icon && <Icon className={`w-4 h-4 ${status === "sending" ? "animate-spin" : ""}`} />}
      <span className="text-sm font-medium">{config.text}</span>
    </div>
  );
}

