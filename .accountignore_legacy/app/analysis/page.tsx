import { FlexibleAnalysis } from "@/components/analysis/flexible-analysis";

export default function AnalysisPage() {
  // In a real app, get companyId from auth context
  const companyId = "default-company-id";

  return (
    <div className="container mx-auto py-6">
      <FlexibleAnalysis companyId={companyId} />
    </div>
  );
}
