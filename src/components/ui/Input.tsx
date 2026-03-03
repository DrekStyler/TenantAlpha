"use client";

import { type InputHTMLAttributes, forwardRef } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: string;
  suffix?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, className = "", id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");

    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label
            htmlFor={inputId}
            className="text-sm font-medium text-navy-700"
          >
            {label}
            {props.required && <span className="ml-0.5 text-red-500">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-sm text-navy-400 pointer-events-none select-none">
              {prefix}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={`w-full rounded-lg border bg-white px-3 py-2 text-sm text-navy-900 placeholder-navy-300 transition-colors focus:outline-none focus:ring-2 focus:ring-navy-500 disabled:cursor-not-allowed disabled:bg-navy-50 disabled:text-navy-400 ${
              error
                ? "border-red-400 focus:ring-red-400"
                : "border-navy-200 hover:border-navy-300"
            } ${prefix ? "pl-7" : ""} ${suffix ? "pr-10" : ""} ${className}`}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-sm text-navy-400 pointer-events-none select-none">
              {suffix}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-navy-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
