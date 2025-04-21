import { cn } from "@/lib/utils";
import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: any;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, type, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const togglePasswordVisibility = () => {
      setShowPassword(!showPassword);
    };

    return (
      <div className="w-full">
        <div className="w-full relative">
          <input
            className={cn(
              "flex h-10 w-full text-slate-700 rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground shadow-sm shadow-black/5 ring-offset-background transition-shadow placeholder:text-muted-foreground/70 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
              type === "search" &&
                "[&::-webkit-search-cancel-button]:appearance-none [&::-webkit-search-decoration]:appearance-none [&::-webkit-search-results-button]:appearance-none [&::-webkit-search-results-decoration]:appearance-none",
              type === "file" &&
                "p-0 pr-3 italic text-muted-foreground/70 file:me-3 file:h-full file:border-0 file:border-r file:border-solid file:border-input file:bg-transparent file:px-3 file:text-sm file:font-medium file:not-italic file:text-foreground",
              className,
              {
                "border-destructive/80 focus-visible:border-destructive/80 focus-visible:ring-destructive/30":
                  error,
              }
            )}
            ref={ref}
            type={showPassword ? "text" : type}
            {...props}
          />
          {type === "password" && (
            <a
              className="absolute top-1/2 cursor-pointer right-4 transform -translate-y-1/2 text-slate-500 dark:text-slate-300"
              type="button"
              onClick={togglePasswordVisibility}
            >
              {showPassword ? <Eye size={16} /> : <EyeOff size={16} />}
            </a>
          )}
        </div>
        {error && (
          <span className="text-red-500 first-letter-uppercase text-sm">
            {error}
          </span>
        )}
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
