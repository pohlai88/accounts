// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Building2,
  Plus,
  TreePine,
  Users,
  TrendingUp,
  Settings,
  Eye,
  Edit,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import {
  CompanyHierarchyService,
  CompanyHierarchy,
  CompanyRelationship,
  ConsolidatedStructure,
  Company,
  RelationshipType,
} from "@/lib/company-hierarchy";

interface CompanyHierarchyProps {
  companyId: string;
}

export function CompanyHierarchyManagement({ companyId }: CompanyHierarchyProps) {
  const [relationships, setRelationships] = useState<CompanyRelationship[]>([]);
  const [consolidatedStructure, setConsolidatedStructure] = useState<ConsolidatedStructure[]>([]);
  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    loadData();
  }, [companyId]);

  const loadData = async () => {
    try {
      const [relationshipsResult, structureResult, companiesResult] = await Promise.all([
        CompanyHierarchyService.getCompanyRelationships(companyId),
        CompanyHierarchyService.getConsolidatedStructure(companyId),
        CompanyHierarchyService.getAllCompanies(),
      ]);

      if (relationshipsResult.success && relationshipsResult.relationships) {
        setRelationships(relationshipsResult.relationships);
      }

      if (structureResult.success && structureResult.structure) {
        setConsolidatedStructure(structureResult.structure);
      }

      if (companiesResult.success && companiesResult.companies) {
        setAllCompanies(companiesResult.companies);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRelationship = async (
    relationshipData: Omit<CompanyHierarchy, "id" | "created_at" | "updated_at">,
  ) => {
    try {
      const result = await CompanyHierarchyService.createRelationship(relationshipData);
      if (result.success) {
        setShowCreateDialog(false);
        loadData();
      }
    } catch (error) {
      console.error("Error creating relationship:", error);
    }
  };

  const handleDeactivateRelationship = async (relationshipId: string) => {
    try {
      const result = await CompanyHierarchyService.deactivateRelationship(relationshipId);
      if (result.success) {
        loadData();
      }
    } catch (error) {
      console.error("Error deactivating relationship:", error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Company Hierarchy</h2>
          <p className="text-muted-foreground">
            Manage parent-child company relationships for intercompany transactions
          </p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Relationship
            </Button>
          </DialogTrigger>
          <DialogContent>
            <CreateRelationshipForm
              companyId={companyId}
              allCompanies={allCompanies}
              onSuccess={handleCreateRelationship}
              onCancel={() => setShowCreateDialog(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="relationships" className="space-y-4">
        <TabsList>
          <TabsTrigger value="relationships">Relationships</TabsTrigger>
          <TabsTrigger value="structure">Consolidated Structure</TabsTrigger>
          <TabsTrigger value="intercompany">Intercompany Setup</TabsTrigger>
        </TabsList>

        <TabsContent value="relationships" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Company Relationships
              </CardTitle>
              <CardDescription>
                Parent-child relationships for intercompany transactions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading relationships...</div>
              ) : relationships.length > 0 ? (
                <div className="space-y-4">
                  {relationships.map(relationship => (
                    <RelationshipCard
                      key={`${relationship.related_company_id}-${relationship.is_parent ? "parent" : "child"}`}
                      relationship={relationship}
                      onDeactivate={handleDeactivateRelationship}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TreePine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No company relationships found</p>
                  <p className="text-sm">Add relationships to enable intercompany transactions</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="structure" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TreePine className="h-5 w-5 mr-2" />
                Consolidated Structure
              </CardTitle>
              <CardDescription>
                Complete organizational hierarchy with ownership percentages
              </CardDescription>
            </CardHeader>
            <CardContent>
              {consolidatedStructure.length > 0 ? (
                <div className="space-y-2">
                  {consolidatedStructure.map(company => (
                    <div
                      key={company.company_id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                      style={{ marginLeft: `${company.level * 20}px` }}
                    >
                      <div className="flex items-center space-x-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            company.level === 0
                              ? "bg-blue-500"
                              : company.level === 1
                                ? "bg-green-500"
                                : "bg-gray-400"
                          }`}
                        ></div>
                        <div>
                          <p className="font-medium">{company.company_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Level {company.level} • {company.path}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold">{company.ownership_percentage.toFixed(2)}%</p>
                        <p className="text-sm text-muted-foreground">Ownership</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <TreePine className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No consolidated structure available</p>
                  <p className="text-sm">Add company relationships to see structure</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intercompany" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Settings className="h-5 w-5 mr-2" />
                Intercompany Setup
              </CardTitle>
              <CardDescription>Configure intercompany accounts and validate setup</CardDescription>
            </CardHeader>
            <CardContent>
              <IntercompanySetup companyId={companyId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface RelationshipCardProps {
  relationship: CompanyRelationship;
  onDeactivate: (id: string) => void;
}

function RelationshipCard({ relationship, onDeactivate }: RelationshipCardProps) {
  const getRelationshipIcon = (type: RelationshipType) => {
    switch (type) {
      case "Parent":
        return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case "Subsidiary":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "Sister":
        return <Users className="h-4 w-4 text-purple-500" />;
      case "Joint Venture":
        return <Building2 className="h-4 w-4 text-orange-500" />;
    }
  };

  const getRelationshipColor = (type: RelationshipType) => {
    switch (type) {
      case "Parent":
        return "bg-blue-100 text-blue-800";
      case "Subsidiary":
        return "bg-green-100 text-green-800";
      case "Sister":
        return "bg-purple-100 text-purple-800";
      case "Joint Venture":
        return "bg-orange-100 text-orange-800";
    }
  };

  return (
    <div className="p-4 border rounded-lg">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {getRelationshipIcon(relationship.relationship_type)}
          <div>
            <p className="font-medium">{relationship.related_company_name}</p>
            <p className="text-sm text-muted-foreground">
              {relationship.is_parent ? "Parent Company" : "Related Company"}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <p className="font-bold">{relationship.ownership_percentage.toFixed(2)}%</p>
            <p className="text-sm text-muted-foreground">Ownership</p>
          </div>
          <Badge className={getRelationshipColor(relationship.relationship_type)}>
            {relationship.relationship_type}
          </Badge>
        </div>
      </div>
    </div>
  );
}

interface CreateRelationshipFormProps {
  companyId: string;
  allCompanies: Company[];
  onSuccess: (relationship: Omit<CompanyHierarchy, "id" | "created_at" | "updated_at">) => void;
  onCancel: () => void;
}

function CreateRelationshipForm({
  companyId,
  allCompanies,
  onSuccess,
  onCancel,
}: CreateRelationshipFormProps) {
  const [formData, setFormData] = useState({
    parent_company_id: companyId,
    child_company_id: "",
    relationship_type: "Subsidiary" as RelationshipType,
    ownership_percentage: 100,
    established_date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSuccess({
      ...formData,
      is_active: true,
    });
  };

  const availableCompanies = allCompanies.filter(c => c.id !== companyId);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="parent_company_id">Parent Company</Label>
        <Select
          value={formData.parent_company_id}
          onValueChange={value => setFormData({ ...formData, parent_company_id: value })}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {allCompanies.map(company => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="child_company_id">Child Company</Label>
        <Select
          value={formData.child_company_id}
          onValueChange={value => setFormData({ ...formData, child_company_id: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select child company" />
          </SelectTrigger>
          <SelectContent>
            {availableCompanies.map(company => (
              <SelectItem key={company.id} value={company.id}>
                {company.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="relationship_type">Relationship Type</Label>
        <Select
          value={formData.relationship_type}
          onValueChange={(value: RelationshipType) =>
            setFormData({ ...formData, relationship_type: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Subsidiary">Subsidiary</SelectItem>
            <SelectItem value="Sister">Sister Company</SelectItem>
            <SelectItem value="Joint Venture">Joint Venture</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="ownership_percentage">Ownership Percentage</Label>
        <Input
          id="ownership_percentage"
          type="number"
          min="0"
          max="100"
          step="0.01"
          value={formData.ownership_percentage}
          onChange={e =>
            setFormData({ ...formData, ownership_percentage: parseFloat(e.target.value) || 0 })
          }
          placeholder="Enter ownership percentage"
          required
        />
      </div>

      <div>
        <Label htmlFor="established_date">Established Date</Label>
        <Input
          id="established_date"
          type="date"
          value={formData.established_date}
          onChange={e => setFormData({ ...formData, established_date: e.target.value })}
          required
        />
      </div>

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">Create Relationship</Button>
      </div>
    </form>
  );
}

interface IntercompanySetupProps {
  companyId: string;
}

function IntercompanySetup({ companyId }: IntercompanySetupProps) {
  const [hasRelationships, setHasRelationships] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkRelationships();
  }, [companyId]);

  const checkRelationships = async () => {
    try {
      const result = await CompanyHierarchyService.hasRelationships(companyId);
      if (result.success) {
        setHasRelationships(result.hasRelationships || false);
      }
    } catch (error) {
      console.error("Error checking relationships:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-8">Checking setup...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-3 p-4 border rounded-lg">
        {hasRelationships ? (
          <>
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
            <div>
              <p className="font-medium text-green-800">Intercompany Ready</p>
              <p className="text-sm text-green-600">
                Company relationships are set up. Intercompany transactions are enabled.
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
            </div>
            <div>
              <p className="font-medium text-yellow-800">Setup Required</p>
              <p className="text-sm text-yellow-600">
                No company relationships found. Add relationships to enable intercompany
                transactions.
              </p>
            </div>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Company Relationships</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Set up parent-child relationships between companies in your group.
            </p>
            <Button variant="outline" className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Add Relationship
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Intercompany Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Configure accounts for intercompany transactions.
            </p>
            <Button variant="outline" className="w-full">
              <Settings className="h-4 w-4 mr-2" />
              Setup Accounts
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
