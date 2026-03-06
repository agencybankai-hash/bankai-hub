import { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && (
          <label
            htmlFor={id}
            className="block text-sm font-medium text-slate-300"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            "w-full rounded-lg border bg-white/5 px-3 py-2 text-sm text-slate-200 placeholder:text-slate-500 transition-colors",
            "border-white/10 focus:border-[#a78bfa]/50 focus:outline-none focus:ring-1 focus:ring-[#a78bfa]/40",
            error && "border-red-500/50 focus:border-red-500/50 focus:ring-red-500/40",
            className
          )}
          {...props}
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
export { Input };
export type { InputProps };
