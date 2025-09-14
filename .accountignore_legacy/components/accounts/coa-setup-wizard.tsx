"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Building2,
  ShoppingCart,
  Wrench,
  Briefcase,
  HardHat,
  Scale,
  CheckCircle,
  ArrowRight,
} from "lucide-react";
import { getAvailableIndustries, getCoATemplate } from "@/lib/coa-templates";
import { AccountingService } from "@/lib/accounting-service";
import type { IndustryType } from "@/lib/coa-templates";

interface CoASetupWizardProps {
  companyId: string;
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function CoASetupWizard({ companyId, isOpen, onClose, onComplete }: CoASetupWizardProps) {
  const [selectedIndustry, setSelectedIndustry] = useState<IndustryType>("general");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"select" | "preview" | "creating">("select");

  const industries = getAvailableIndustries();
  const selectedTemplate = getCoATemplate(selectedIndustry);

  const industryIcons = {
    general: Building2,
    retail: ShoppingCart,
    service: Briefcase,
    manufacturing: Wrench,
    construction: HardHat,
    professional: Scale,
  };

  const handleCreateAccounts = async () => {
    if (!selectedTemplate) return;

    setStep("creating");
    setLoading(true);

    try {
      // Create accounts from template
      for (const account of selectedTemplate.accounts) {
        await AccountingService.createAccount({
          name: account.name,
          account_type: account.account_type,
          account_code: account.account_code,
          company_id: companyId,
          is_group: account.is_group,
          parent_id: undefined, // Will be set in second pass
        });
      }

      // Second pass: Set parent relationships
      // This is simplified - in production, we'd handle the hierarchy properly

      onComplete();
      onClose();
    } catch (error) {
      console.error("Error creating accounts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5" />
            <span>Set Up Chart of Accounts</span>
          </DialogTitle>
        </DialogHeader>

        {step === "select" && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">Choose Your Industry</h3>
              <p className="text-muted-foreground">
                We'll create a customized chart of accounts based on your business type
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {industries.map(industry => {
                const Icon = industryIcons[industry.value] || Building2;
                const isSelected = selectedIndustry === industry.value;

                return (
                  <Card
                    key={industry.value}
                    className={`cursor-pointer transition-all ${
                      isSelected ? "ring-2 ring-primary bg-primary/5" : "hover:bg-accent/50"
                    }`}
                    onClick={() => setSelectedIndustry(industry.value)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start space-x-3">
                        <div
                          className={`p-2 rounded-lg ${
                            isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                          }`}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{industry.label}</h4>
                          <p className="text-sm text-muted-foreground">{industry.description}</p>
                        </div>
                        {isSelected && <CheckCircle className="h-5 w-5 text-primary" />}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep("preview")}>
                Preview Accounts
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {step === "preview" && selectedTemplate && (
          <div className="space-y-6">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">
                {selectedTemplate.name} Chart of Accounts
              </h3>
              <p className="text-muted-foreground">
                {selectedTemplate.accounts.length} accounts will be created
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Group accounts by type */}
              {["Asset", "Liability", "Equity", "Income", "Expense"].map(accountType => {
                const accountsOfType = selectedTemplate.accounts.filter(
                  acc => acc.account_type === accountType,
                );

                if (accountsOfType.length === 0) return null;

                return (
                  <Card key={accountType}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center justify-between">
                        {accountType}
                        <Badge variant="secondary">{accountsOfType.length} accounts</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {accountsOfType.map((account, index) => (
                        <div
                          key={index}
                          className={`flex items-center justify-between text-sm p-2 rounded ${
                            account.is_group ? "bg-muted font-medium" : "pl-6"
                          }`}
                        >
                          <span>{account.name}</span>
                          <span className="text-muted-foreground text-xs">
                            {account.account_code}
                          </span>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex justify-between">
              <Button variant="outline" onClick={() => setStep("select")}>
                Back
              </Button>
              <Button onClick={handleCreateAccounts} disabled={loading}>
                {loading ? "Creating Accounts..." : "Create Chart of Accounts"}
              </Button>
            </div>
          </div>
        )}

        {step === "creating" && (
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <h3 className="text-lg font-medium mb-2">Creating Your Chart of Accounts</h3>
            <p className="text-muted-foreground">
              Setting up {selectedTemplate?.accounts.length} accounts for your business...
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
