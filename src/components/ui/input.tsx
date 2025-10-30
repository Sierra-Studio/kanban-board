"use client";

import * as React from "react";
import { Input as BaseInput } from "@base-ui-components/react/input";

export interface InputProps extends React.ComponentPropsWithRef<typeof BaseInput> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const inputStyles = `
      block w-full rounded-md border px-3 py-2
      text-gray-900 placeholder-gray-400
      focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
      disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500
      ${error ? "border-red-500" : "border-gray-300"}
      ${className || ""}
    `.trim();

    return (
      <div className="space-y-1">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-gray-700"
          >
            {label}
          </label>
        )}
        <BaseInput
          ref={ref}
          id={inputId}
          className={inputStyles}
          aria-invalid={!!error}
          aria-describedby={error ? `${inputId}-error` : undefined}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";