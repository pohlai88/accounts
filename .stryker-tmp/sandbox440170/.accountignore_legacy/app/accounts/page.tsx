// @ts-nocheck
import { ChartOfAccounts } from "@/components/accounts/chart-of-accounts";

// For now, using a mock company ID
// In Phase 3, this will come from user session/company selection
const MOCK_COMPANY_ID = "550e8400-e29b-41d4-a716-446655440000";

export default function AccountsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Chart of Accounts</h1>
              <p className="text-muted-foreground">
                Manage your accounting structure and account hierarchy
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <ChartOfAccounts companyId={MOCK_COMPANY_ID} />
      </main>
    </div>
  );
}
