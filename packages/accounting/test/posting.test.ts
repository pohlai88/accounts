import { describe, it, expect, vi, beforeEach } from "vitest";
import { postJournal, JournalPostingInput } from "../src/posting";

// Mock the database functions
vi.mock("@aibos/db", () => ({
  getAccountsInfo: vi.fn().mockResolvedValue(
    new Map([
      [
        "00000000-0000-0000-0000-000000000001",
        {
          id: "00000000-0000-0000-0000-000000000001",
          code: "1000",
          name: "Cash",
          accountType: "ASSET",
          currency: "MYR",
          isActive: true,
          level: 1,
          parentId: undefined,
        },
      ],
      [
        "00000000-0000-0000-0000-000000000002",
        {
          id: "00000000-0000-0000-0000-000000000002",
          code: "2000",
          name: "Accounts Payable",
          accountType: "LIABILITY",
          currency: "MYR",
          isActive: true,
          level: 1,
          parentId: undefined,
        },
      ],
    ]),
  ),
  getAllAccountsInfo: vi.fn().mockResolvedValue([]),
}));

describe("posting", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockContext = {
    tenantId: "tenant-123",
    companyId: "company-456",
    userId: "user-789",
    userRole: "manager",
  };

  const createTestInput = (
    lines: Array<{
      accountId: string;
      debit: number;
      credit: number;
      description?: string;
      reference?: string;
    }>,
  ): JournalPostingInput => ({
    journalNumber: "JE-001",
    description: "Test journal entry",
    journalDate: new Date("2024-01-01"),
    currency: "MYR",
    lines,
    context: mockContext,
  });

  it("accepts balanced lines", async () => {
    const input = createTestInput([
      { accountId: "00000000-0000-0000-0000-000000000001", debit: 100, credit: 0 },
      { accountId: "00000000-0000-0000-0000-000000000002", debit: 0, credit: 100 },
    ]);

    const res = await postJournal(input);
    expect(res.validated).toBe(true);
    expect(res.totalDebit).toBe(100);
    expect(res.totalCredit).toBe(100);
  });

  it("rejects unbalanced journal", async () => {
    const input = createTestInput([
      { accountId: "00000000-0000-0000-0000-000000000001", debit: 100, credit: 0 },
    ]);

    await expect(postJournal(input)).rejects.toThrow("Journal must be balanced");
  });

  it("validates SoD compliance", async () => {
    const clerkContext = { ...mockContext, userRole: "clerk" };
    const input = createTestInput([
      { accountId: "00000000-0000-0000-0000-000000000001", debit: 100, credit: 0 },
      { accountId: "00000000-0000-0000-0000-000000000002", debit: 0, credit: 100 },
    ]);
    input.context = clerkContext;

    await expect(postJournal(input)).rejects.toThrow("not authorized to post journal entries");
  });

  it("requires approval for manager role", async () => {
    const input = createTestInput([
      { accountId: "00000000-0000-0000-0000-000000000001", debit: 100, credit: 0 },
      { accountId: "00000000-0000-0000-0000-000000000002", debit: 0, credit: 100 },
    ]);

    const res = await postJournal(input);
    expect(res.requiresApproval).toBe(true);
    expect(res.approverRoles).toContain("manager");
  });
});
