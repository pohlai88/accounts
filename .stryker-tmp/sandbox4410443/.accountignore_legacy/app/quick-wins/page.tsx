// @ts-nocheck
import { QuickWinsDashboard } from "@/components/quick-wins/quick-wins-dashboard";

// For now, using a mock company ID
// In a real app, this would come from user session/company selection
const MOCK_COMPANY_ID = "550e8400-e29b-41d4-a716-446655440000";

export default function QuickWinsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Quick Wins Dashboard</h1>
              <p className="text-muted-foreground">
                Power user features and performance optimizations
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <QuickWinsDashboard companyId={MOCK_COMPANY_ID} />
      </main>
    </div>
  );
}
