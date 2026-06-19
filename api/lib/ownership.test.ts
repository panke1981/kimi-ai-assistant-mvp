import { describe, expect, it, vi } from "vitest";
import { TRPCError } from "@trpc/server";
import { assertActionTaskOwner, assertCompanyOwner, assertDiagnosisResultOwner } from "./ownership";
import type { getDb } from "../queries/connection";

function makeDb(result: unknown[]) {
  const chain = {
    select: vi.fn(() => chain),
    from: vi.fn(() => chain),
    innerJoin: vi.fn(() => chain),
    where: vi.fn(() => chain),
    limit: vi.fn(async () => result),
  };
  return chain as unknown as ReturnType<typeof getDb>;
}

describe("ownership helpers", () => {
  it("allows a company record owned by the current user", async () => {
    const db = makeDb([{ id: 1 }]);

    await expect(assertCompanyOwner(db, 1, 10)).resolves.toEqual({ id: 1 });
  });

  it("rejects a company id outside the current user's ownership", async () => {
    const db = makeDb([]);

    await expect(assertCompanyOwner(db, 1, 10)).rejects.toBeInstanceOf(TRPCError);
  });

  it("allows a diagnosis result owned through its company", async () => {
    const db = makeDb([{ id: 9, companyId: 1, periodId: 2 }]);

    await expect(assertDiagnosisResultOwner(db, 9, 10)).resolves.toEqual({ id: 9, companyId: 1, periodId: 2 });
  });

  it("rejects an action task outside the current user's ownership", async () => {
    const db = makeDb([]);

    await expect(assertActionTaskOwner(db, 5, 10)).rejects.toBeInstanceOf(TRPCError);
  });
});
