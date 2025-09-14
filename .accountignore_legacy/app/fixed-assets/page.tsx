import { FixedAssetsManagement } from "@/components/fixed-assets/fixed-assets-management";

// For now, using a mock company ID
// In a real app, this would come from user session/company selection
const MOCK_COMPANY_ID = "550e8400-e29b-41d4-a716-446655440000";

export default function FixedAssetsPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Fixed Assets Management</h1>
              <p className="text-muted-foreground">
                Comprehensive asset management with depreciation, disposal, and maintenance tracking
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        <FixedAssetsManagement companyId={MOCK_COMPANY_ID} />
      </main>
    </div>
  );
}
