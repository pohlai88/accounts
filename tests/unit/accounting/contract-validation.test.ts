import { z } from "zod";
import { describe, it, expect } from "vitest";

const JournalResult = z.object({
    validated: z.boolean(),
    journalInput: z.object({
        lines: z.array(z.object({
            accountId: z.string(),
            debit: z.number().optional(),
            credit: z.number().optional()
        }))
    })
});

describe("Contract Validation", () => {
    it("should validate the shape of journal posting result", async () => {
        // Mock a simple journal result
        const mockResult = {
            validated: true,
            journalInput: {
                lines: [
                    { accountId: "acc-1", debit: 100 },
                    { accountId: "acc-2", credit: 100 }
                ]
            }
        };

        expect(() => JournalResult.parse(mockResult)).not.toThrow();
    });

    it("should reject invalid journal result shapes", async () => {
        const invalidResult = {
            validated: "not-a-boolean", // Should be boolean
            journalInput: {
                lines: "not-an-array" // Should be array
            }
        };

        expect(() => JournalResult.parse(invalidResult)).toThrow();
    });
});
