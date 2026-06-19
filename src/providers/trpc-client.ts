import { createTRPCReact } from "@trpc/react-query";

import type { AppRouter } from "../../api/router";

export const trpc = createTRPCReact<AppRouter>();

export function getTRPCErrorStatus(error: unknown) {
  if (
    typeof error === "object"
    && error !== null
    && "data" in error
    && typeof error.data === "object"
    && error.data !== null
    && "httpStatus" in error.data
    && typeof error.data.httpStatus === "number"
  ) {
    return error.data.httpStatus;
  }
  return null;
}
