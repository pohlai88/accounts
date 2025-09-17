// @ts-nocheck
import { SecurityDashboard } from "@/components/security/security-dashboard";

// For now, using a mock company ID
// In a real app, this would come from user session/company selection
const MOCK_COMPANY_ID = "550e8400-e29b-41d4-a716-446655440000";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Security & Compliance</h1>
              <p className="text-muted-foreground">
                Enterprise-grade security, audit trails, and compliance management
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <SecurityDashboard companyId={MOCK_COMPANY_ID} />
      </main>
    </div>
  );
}
