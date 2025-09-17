// @ts-nocheck
import { CompanyHierarchyManagement } from "@/components/accounts/company-hierarchy";

export default function HierarchyPage() {
  // In a real app, get companyId from auth context
  const companyId = "default-company-id";

  return (
    <div className="container mx-auto py-6">
      <CompanyHierarchyManagement companyId={companyId} />
    </div>
  );
}
