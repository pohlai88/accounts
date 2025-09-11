import * as React from "react";
import { TOKENS } from "./tokens";

export function Button(props: React.ComponentProps<"button">) {
  return (
    <button
      {...props}
      className="inline-flex items-center justify-center rounded-2xl px-4 py-2"
      style={{
        borderRadius: TOKENS.radius,
        padding: `${TOKENS.spacing.sm} ${TOKENS.spacing.md}`
      }}
    />
  );
}
