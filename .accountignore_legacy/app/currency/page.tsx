import { MultiCurrency } from "@/components/accounts/multi-currency";

export default function CurrencyPage() {
  // In a real app, get companyId from auth context
  const companyId = "default-company-id";

  return (
    <div className="container mx-auto py-6">
      <MultiCurrency companyId={companyId} />
    </div>
  );
}
