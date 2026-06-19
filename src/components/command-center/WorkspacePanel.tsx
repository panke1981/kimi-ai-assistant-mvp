import type { ComponentPropsWithoutRef } from "react";

export function WorkspacePanel({ children, className = "", style, ...props }: ComponentPropsWithoutRef<"section">) {
  return (
    <section
      {...props}
      className={`border bg-white ${className}`}
      style={{
        borderColor: "var(--border-default)",
        boxShadow: "0 18px 45px rgba(15, 23, 42, 0.05)",
        ...style,
      }}
    >
      {children}
    </section>
  );
}
