import { useState } from "react";
import {
  AlertCircleIcon,
  AlertTriangle,
  CheckCheckIcon,
  InfoIcon,
} from "lucide-react";

const AlertVariants = {
  info: {
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-300",
    icon: <InfoIcon className="h-4 w-4 mr-3" />,
  },
  danger: {
    bg: "bg-red-50",
    text: "text-red-600",
    border: "border-red-500",
    icon: <AlertTriangle className="h-4 w-4 mr-3" />,
  },
  success: {
    bg: "bg-green-50",
    text: "text-green-800",
    border: "border-green-300",
    icon: <CheckCheckIcon className="h-4 w-4 mr-3" />,
  },
  warning: {
    bg: "bg-yellow-50",
    text: "text-yellow-800",
    border: "border-yellow-300",
    icon: <AlertCircleIcon className="h-4 w-4 mr-3" />,
  },
};

const Alert = ({ variant = "info", children }) => {
  const [visible] = useState(true);

  if (!visible) {
    return null;
  }

  const { bg, text, border, icon } = AlertVariants[variant];

  return (
    <div
      className={`flex items-center py-2.5 px-3 mb-2 text-sm border rounded-lg dark:bg-gray-800 ${bg} ${text} ${border} dark:text-${text.slice(
        5
      )} dark:border-${border.slice(6)}`}
      role="alert"
    >
      {icon}
      <span className="sr-only">Info</span>
      <div>{children}</div>
    </div>
  );
};

export default Alert;
