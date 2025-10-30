"use client";

import * as React from "react";
import { Form as BaseForm } from "@base-ui-components/react/form";

export interface FormProps extends React.ComponentPropsWithRef<typeof BaseForm> {
  onSubmit?: (event: React.FormEvent<HTMLFormElement>) => void | Promise<void>;
}

export const Form = React.forwardRef<HTMLFormElement, FormProps>(
  ({ className, onSubmit, children, ...props }, ref) => {
    return (
      <BaseForm
        ref={ref}
        className={className}
        onSubmit={onSubmit}
        {...props}
      >
        {children}
      </BaseForm>
    );
  }
);

Form.displayName = "Form";