// @ts-nocheck
"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Database,
  Search,
  Tag,
  Link,
  History,
  Shield,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Eye,
  Edit,
  Plus,
  RefreshCw,
  BarChart3,
  Users,
  Clock,
} from "lucide-react";
import {
  MetadataManagementService,
  EntityType,
  DataQualityMetrics,
  DataLineage,
  DataTag,
  DataChangeHistory,
} from "@/lib/metadata-management";
import { format } from "date-fns";

interface MetadataManagementProps {
  companyId: string;
  entityType: EntityType;
  entityId: string;
}

export function MetadataManagement({ companyId, entityType, entityId }: MetadataManagementProps) {
  const [qualityMetrics, setQualityMetrics] = useState<DataQualityMetrics | null>(null);
  const [lineage, setLineage] = useState<DataLineage[]>([]);
  const [tags, setTags] = useState<DataTag[]>([]);
  const [changeHistory, setChangeHistory] = useState<DataChangeHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddTagDialog, setShowAddTagDialog] = useState(false);
  const [newTag, setNewTag] = useState({
    tagName: "",
    tagValue: "",
    tagCategory: "Business" as const,
  });

  useEffect(() => {
    loadMetadata();
  }, [entityType, entityId]);

  const loadMetadata = async () => {
    setLoading(true);
    try {
      await Promise.all([loadQualityMetrics(), loadLineage(), loadTags(), loadChangeHistory()]);
    } finally {
      setLoading(false);
    }
  };

  const loadQualityMetrics = async () => {
    try {
      const result = await MetadataManagementService.getQualityMetrics(entityType, entityId);
      if (result.success && result.metrics) {
        setQualityMetrics(result.metrics);
      }
    } catch (error) {
      console.error("Error loading quality metrics:", error);
    }
  };

  const loadLineage = async () => {
    try {
      const result = await MetadataManagementService.getLineage(entityType, entityId);
      if (result.success && result.lineage) {
        setLineage(result.lineage);
      }
    } catch (error) {
      console.error("Error loading lineage:", error);
    }
  };

  const loadTags = async () => {
    try {
      const result = await MetadataManagementService.getTags(entityType, entityId);
      if (result.success && result.tags) {
        setTags(result.tags);
      }
    } catch (error) {
      console.error("Error loading tags:", error);
    }
  };

  const loadChangeHistory = async () => {
    try {
      const result = await MetadataManagementService.getChangeHistory(entityType, entityId, 20);
      if (result.success && result.history) {
        setChangeHistory(result.history);
      }
    } catch (error) {
      console.error("Error loading change history:", error);
    }
  };

  const handleAddTag = async () => {
    try {
      const result = await MetadataManagementService.addTag(
        companyId,
        entityType,
        entityId,
        newTag.tagName,
        newTag.tagValue,
        newTag.tagCategory,
      );

      if (result.success) {
        setShowAddTagDialog(false);
        setNewTag({ tagName: "", tagValue: "", tagCategory: "Business" });
        loadTags();
      }
    } catch (error) {
      console.error("Error adding tag:", error);
    }
  };

  const getQualityColor = (score: number) => {
    if (score >= 80) return "text-green-600 bg-green-50";
    if (score >= 60) return "text-yellow-600 bg-yellow-50";
    return "text-red-600 bg-red-50";
  };

  const getQualityIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="h-4 w-4 text-green-500" />;
    if (score >= 60) return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-red-500" />;
  };

  const getTagColor = (category: string) => {
    switch (category) {
      case "Business":
        return "text-blue-600 bg-blue-50";
      case "Technical":
        return "text-purple-600 bg-purple-50";
      case "Compliance":
        return "text-red-600 bg-red-50";
      case "Quality":
        return "text-green-600 bg-green-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case "Create":
        return "text-green-600 bg-green-50";
      case "Update":
        return "text-blue-600 bg-blue-50";
      case "Delete":
        return "text-red-600 bg-red-50";
      case "Merge":
        return "text-purple-600 bg-purple-50";
      case "Split":
        return "text-orange-600 bg-orange-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Data Governance</h2>
          <p className="text-muted-foreground">
            Metadata management, data quality, and lineage tracking for {entityType}
          </p>
        </div>
        <Button variant="outline" onClick={loadMetadata} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Data Quality Overview */}
      {qualityMetrics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Data Quality</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {qualityMetrics.completenessScore.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Completeness</div>
                <Progress value={qualityMetrics.completenessScore} className="h-2 mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {qualityMetrics.accuracyScore.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Accuracy</div>
                <Progress value={qualityMetrics.accuracyScore} className="h-2 mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {qualityMetrics.consistencyScore.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Consistency</div>
                <Progress value={qualityMetrics.consistencyScore} className="h-2 mt-2" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {qualityMetrics.timelinessScore.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Timeliness</div>
                <Progress value={qualityMetrics.timelinessScore} className="h-2 mt-2" />
              </div>
              <div className="text-center">
                <div
                  className={`text-2xl font-bold ${getQualityColor(qualityMetrics.overallScore).split(" ")[0]}`}
                >
                  {qualityMetrics.overallScore.toFixed(1)}%
                </div>
                <div className="text-sm text-muted-foreground">Overall</div>
                <div className="flex items-center justify-center mt-2">
                  {getQualityIcon(qualityMetrics.overallScore)}
                  <Badge className={`ml-2 ${getQualityColor(qualityMetrics.overallScore)}`}>
                    {qualityMetrics.validationStatus}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content */}
      <Tabs defaultValue="lineage" className="space-y-4">
        <TabsList>
          <TabsTrigger value="lineage">Data Lineage</TabsTrigger>
          <TabsTrigger value="tags">Tags & Classification</TabsTrigger>
          <TabsTrigger value="history">Change History</TabsTrigger>
          <TabsTrigger value="analytics">Usage Analytics</TabsTrigger>
        </TabsList>

        {/* Data Lineage Tab */}
        <TabsContent value="lineage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Link className="h-5 w-5" />
                <span>Data Lineage</span>
              </CardTitle>
              <CardDescription>
                Track the origin and transformation history of this data
              </CardDescription>
            </CardHeader>
            <CardContent>
              {lineage.length > 0 ? (
                <div className="space-y-4">
                  {lineage.map((item, index) => (
                    <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                      <div className="flex-shrink-0">
                        <Database className="h-8 w-8 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{item.sourceSystem}</div>
                        <div className="text-sm text-muted-foreground">
                          {item.sourceTable && `${item.sourceTable} • `}
                          {format(new Date(item.sourceTimestamp), "MMM dd, yyyy HH:mm")}
                        </div>
                        {item.sourceRecordId && (
                          <div className="text-xs text-muted-foreground font-mono">
                            Record ID: {item.sourceRecordId}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{item.sourceSystem}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Lineage Data</h3>
                  <p className="text-muted-foreground">
                    No lineage information available for this {entityType.toLowerCase()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tags Tab */}
        <TabsContent value="tags" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center space-x-2">
                    <Tag className="h-5 w-5" />
                    <span>Tags & Classification</span>
                  </CardTitle>
                  <CardDescription>Organize and categorize your data with tags</CardDescription>
                </div>
                <Dialog open={showAddTagDialog} onOpenChange={setShowAddTagDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Tag
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Data Tag</DialogTitle>
                      <DialogDescription>
                        Add a tag to categorize this {entityType.toLowerCase()}
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="tagName">Tag Name</Label>
                        <Input
                          id="tagName"
                          value={newTag.tagName}
                          onChange={e => setNewTag(prev => ({ ...prev, tagName: e.target.value }))}
                          placeholder="e.g., Critical, PII, Archived"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tagValue">Tag Value (Optional)</Label>
                        <Input
                          id="tagValue"
                          value={newTag.tagValue}
                          onChange={e => setNewTag(prev => ({ ...prev, tagValue: e.target.value }))}
                          placeholder="e.g., High, Yes, 2023"
                        />
                      </div>
                      <div>
                        <Label htmlFor="tagCategory">Category</Label>
                        <Select
                          value={newTag.tagCategory}
                          onValueChange={value =>
                            setNewTag(prev => ({ ...prev, tagCategory: value as any }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Business">Business</SelectItem>
                            <SelectItem value="Technical">Technical</SelectItem>
                            <SelectItem value="Compliance">Compliance</SelectItem>
                            <SelectItem value="Quality">Quality</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex justify-end space-x-2">
                        <Button variant="outline" onClick={() => setShowAddTagDialog(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleAddTag}>Add Tag</Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {tags.map(tag => (
                    <Badge key={tag.id} className={getTagColor(tag.tagCategory || "Business")}>
                      {tag.tagName}
                      {tag.tagValue && `: ${tag.tagValue}`}
                    </Badge>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Tag className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Tags</h3>
                  <p className="text-muted-foreground mb-4">
                    Add tags to organize and categorize this {entityType.toLowerCase()}
                  </p>
                  <Button onClick={() => setShowAddTagDialog(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Tag
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Change History Tab */}
        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <History className="h-5 w-5" />
                <span>Change History</span>
              </CardTitle>
              <CardDescription>
                Track all changes made to this {entityType.toLowerCase()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {changeHistory.length > 0 ? (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Field</TableHead>
                        <TableHead>Changed By</TableHead>
                        <TableHead>Source</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {changeHistory.map(change => (
                        <TableRow key={change.id}>
                          <TableCell>
                            {format(new Date(change.changedAt), "MMM dd, yyyy HH:mm")}
                          </TableCell>
                          <TableCell>
                            <Badge className={getChangeTypeColor(change.changeType)}>
                              {change.changeType}
                            </Badge>
                          </TableCell>
                          <TableCell>{change.fieldName || "-"}</TableCell>
                          <TableCell>{change.changedBy}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{change.changeSource}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">No Change History</h3>
                  <p className="text-muted-foreground">
                    No changes have been recorded for this {entityType.toLowerCase()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Usage Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Usage Analytics</span>
              </CardTitle>
              <CardDescription>
                Track how this {entityType.toLowerCase()} is being used
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Usage Analytics</h3>
                <p className="text-muted-foreground">
                  Usage tracking will be available in the next update
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
