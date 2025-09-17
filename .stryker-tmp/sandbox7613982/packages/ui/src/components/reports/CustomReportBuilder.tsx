// @ts-nocheck
import * as React from "react";
import { cn } from "@aibos/ui/utils";
import {
  FileText,
  Download,
  Save,
  Plus,
  Trash2,
  Eye,
  Settings,
  BarChart3,
  PieChart,
  TrendingUp,
  Calendar,
  Filter,
  Columns,
  Rows,
  Layout,
  Palette,
  Type,
  AlignLeft,
  AlignCenter,
  AlignRight,
  DollarSign,
} from "lucide-react";

// SSOT Compliant Custom Report Builder Component
// Drag-and-drop report builder with templates, filters, and export capabilities

export interface ReportField {
  id: string;
  name: string;
  label: string;
  type: "text" | "number" | "currency" | "date" | "percentage";
  format?: string;
  aggregation?: "sum" | "avg" | "count" | "min" | "max";
  visible: boolean;
  order: number;
}

export interface ReportFilter {
  id: string;
  field: string;
  operator:
    | "equals"
    | "not_equals"
    | "contains"
    | "not_contains"
    | "greater_than"
    | "less_than"
    | "between"
    | "in"
    | "not_in";
  value: any;
  label: string;
}

export interface ReportSection {
  id: string;
  type: "header" | "table" | "chart" | "summary" | "narrative";
  title: string;
  content: any;
  order: number;
  visible: boolean;
  style?: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: string;
    alignment?: "left" | "center" | "right";
    padding?: string;
  };
}

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: "financial" | "operational" | "compliance" | "custom";
  sections: ReportSection[];
  fields: ReportField[];
  filters: ReportFilter[];
  isPublic: boolean;
  createdBy: string;
  createdAt: string;
}

export interface CustomReportBuilderProps {
  templates: ReportTemplate[];
  availableFields: ReportField[];
  onSave?: (report: ReportTemplate) => Promise<void>;
  onLoad?: (reportId: string) => Promise<ReportTemplate>;
  onExport?: (report: ReportTemplate, format: "pdf" | "excel" | "csv") => Promise<void>;
  onPreview?: (report: ReportTemplate) => void;
  className?: string;
}

export const CustomReportBuilder: React.FC<CustomReportBuilderProps> = ({
  templates,
  availableFields,
  onSave,
  onLoad,
  onExport,
  onPreview,
  className,
}) => {
  const [currentReport, setCurrentReport] = React.useState<ReportTemplate | null>(null);
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null);
  const [isPreviewMode, setIsPreviewMode] = React.useState(false);
  const [isSaving, setIsSaving] = React.useState(false);
  const [isExporting, setIsExporting] = React.useState(false);
  const [dragOver, setDragOver] = React.useState<string | null>(null);

  const [reportName, setReportName] = React.useState("");
  const [reportDescription, setReportDescription] = React.useState("");
  const [reportCategory, setReportCategory] = React.useState<
    "financial" | "operational" | "compliance" | "custom"
  >("custom");

  const handleCreateNew = () => {
    const newReport: ReportTemplate = {
      id: `report_${Date.now()}`,
      name: "New Report",
      description: "",
      category: "custom",
      sections: [],
      fields: [],
      filters: [],
      isPublic: false,
      createdBy: "current_user",
      createdAt: new Date().toISOString(),
    };
    setCurrentReport(newReport);
    setReportName("");
    setReportDescription("");
    setReportCategory("custom");
  };

  const handleLoadTemplate = async (templateId: string) => {
    try {
      const template = await onLoad?.(templateId);
      if (template) {
        setCurrentReport(template);
        setReportName(template.name);
        setReportDescription(template.description);
        setReportCategory(template.category);
      }
    } catch (error) {
      console.error("Failed to load template:", error);
    }
  };

  const handleSave = async () => {
    if (!currentReport) return;

    setIsSaving(true);
    try {
      const updatedReport = {
        ...currentReport,
        name: reportName || "Untitled Report",
        description: reportDescription,
        category: reportCategory,
      };
      await onSave?.(updatedReport);
      setCurrentReport(updatedReport);
    } catch (error) {
      console.error("Failed to save report:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleExport = async (format: "pdf" | "excel" | "csv") => {
    if (!currentReport) return;

    setIsExporting(true);
    try {
      await onExport?.(currentReport, format);
    } catch (error) {
      console.error("Failed to export report:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddField = (field: ReportField) => {
    if (!currentReport) return;

    const newField = {
      ...field,
      id: `field_${Date.now()}`,
      visible: true,
      order: currentReport.fields.length,
    };

    setCurrentReport({
      ...currentReport,
      fields: [...currentReport.fields, newField],
    });
  };

  const handleAddSection = (type: ReportSection["type"]) => {
    if (!currentReport) return;

    const newSection: ReportSection = {
      id: `section_${Date.now()}`,
      type,
      title: `New ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      content: {},
      order: currentReport.sections.length,
      visible: true,
    };

    setCurrentReport({
      ...currentReport,
      sections: [...currentReport.sections, newSection],
    });
  };

  const handleUpdateSection = (sectionId: string, updates: Partial<ReportSection>) => {
    if (!currentReport) return;

    setCurrentReport({
      ...currentReport,
      sections: currentReport.sections.map(section =>
        section.id === sectionId ? { ...section, ...updates } : section,
      ),
    });
  };

  const handleDeleteSection = (sectionId: string) => {
    if (!currentReport) return;

    setCurrentReport({
      ...currentReport,
      sections: currentReport.sections.filter(section => section.id !== sectionId),
    });
  };

  const handleReorderSections = (fromIndex: number, toIndex: number) => {
    if (!currentReport) return;

    const newSections = [...currentReport.sections];
    const [movedSection] = newSections.splice(fromIndex, 1);
    if (movedSection) {
      newSections.splice(toIndex, 0, movedSection);
    }

    setCurrentReport({
      ...currentReport,
      sections: newSections.map((section, index) => ({
        ...section,
        order: index,
      })),
    });
  };

  const getSectionIcon = (type: string) => {
    switch (type) {
      case "header":
        return <Type className="h-4 w-4" />;
      case "table":
        return <Columns className="h-4 w-4" />;
      case "chart":
        return <BarChart3 className="h-4 w-4" />;
      case "summary":
        return <PieChart className="h-4 w-4" />;
      case "narrative":
        return <AlignLeft className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getFieldTypeIcon = (type: string) => {
    switch (type) {
      case "text":
        return <Type className="h-4 w-4" />;
      case "number":
        return <BarChart3 className="h-4 w-4" />;
      case "currency":
        return <DollarSign className="h-4 w-4" />;
      case "date":
        return <Calendar className="h-4 w-4" />;
      case "percentage":
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--sys-text-primary)]">
            Custom Report Builder
          </h1>
          <p className="text-[var(--sys-text-secondary)]">
            Create and customize financial reports with drag-and-drop interface
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreateNew}
            className="px-4 py-2 bg-[var(--sys-accent)] text-white rounded-md hover:bg-[var(--sys-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
          >
            <Plus className="h-4 w-4 mr-2 inline" />
            New Report
          </button>
          {currentReport && (
            <>
              <button
                onClick={() => setIsPreviewMode(!isPreviewMode)}
                className="px-4 py-2 border border-[var(--sys-border-hairline)] text-[var(--sys-text-primary)] rounded-md hover:bg-[var(--sys-bg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
              >
                <Eye className="h-4 w-4 mr-2 inline" />
                {isPreviewMode ? "Edit" : "Preview"}
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 border border-[var(--sys-border-hairline)] text-[var(--sys-text-primary)] rounded-md hover:bg-[var(--sys-bg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] disabled:opacity-50"
              >
                <Save className="h-4 w-4 mr-2 inline" />
                {isSaving ? "Saving..." : "Save"}
              </button>
            </>
          )}
        </div>
      </div>

      {!currentReport ? (
        /* Template Selection */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map(template => (
              <div
                key={template.id}
                className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4 hover:border-[var(--sys-accent)] cursor-pointer transition-colors"
                onClick={() => handleLoadTemplate(template.id)}
              >
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="h-5 w-5 text-[var(--sys-accent)]" />
                  <h3 className="text-lg font-medium text-[var(--sys-text-primary)]">
                    {template.name}
                  </h3>
                </div>
                <p className="text-sm text-[var(--sys-text-secondary)] mb-3">
                  {template.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--sys-text-secondary)]">
                    {template.category}
                  </span>
                  <span className="text-xs text-[var(--sys-text-secondary)]">
                    {template.sections.length} sections
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        /* Report Builder Interface */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Fields & Templates */}
          <div className="lg:col-span-1 space-y-4">
            {/* Report Settings */}
            <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
              <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-4">
                Report Settings
              </h3>
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-1">
                    Report Name
                  </label>
                  <input
                    type="text"
                    value={reportName}
                    onChange={e => setReportName(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                    placeholder="Enter report name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-1">
                    Description
                  </label>
                  <textarea
                    value={reportDescription}
                    onChange={e => setReportDescription(e.target.value)}
                    className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                    placeholder="Enter report description"
                    rows={3}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--sys-text-primary)] mb-1">
                    Category
                  </label>
                  <select
                    value={reportCategory}
                    onChange={e => setReportCategory(e.target.value as any)}
                    className="w-full px-3 py-2 border border-[var(--sys-border-hairline)] rounded-md bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                  >
                    <option value="financial">Financial</option>
                    <option value="operational">Operational</option>
                    <option value="compliance">Compliance</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Available Fields */}
            <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
              <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-4">
                Available Fields
              </h3>
              <div className="space-y-2">
                {availableFields.map(field => (
                  <div
                    key={field.id}
                    className="flex items-center gap-2 p-2 border border-[var(--sys-border-hairline)] rounded-md hover:bg-[var(--sys-bg-subtle)] cursor-pointer"
                    onClick={() => handleAddField(field)}
                  >
                    {getFieldTypeIcon(field.type)}
                    <span className="text-sm text-[var(--sys-text-primary)]">{field.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Section Types */}
            <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
              <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-4">
                Add Section
              </h3>
              <div className="space-y-2">
                {[
                  { type: "header", label: "Header" },
                  { type: "table", label: "Table" },
                  { type: "chart", label: "Chart" },
                  { type: "summary", label: "Summary" },
                  { type: "narrative", label: "Narrative" },
                ].map(section => (
                  <button
                    key={section.type}
                    onClick={() => handleAddSection(section.type as any)}
                    className="w-full flex items-center gap-2 p-2 border border-[var(--sys-border-hairline)] rounded-md hover:bg-[var(--sys-bg-subtle)] text-left"
                  >
                    {getSectionIcon(section.type)}
                    <span className="text-sm text-[var(--sys-text-primary)]">{section.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="lg:col-span-3">
            {isPreviewMode ? (
              /* Preview Mode */
              <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--sys-text-primary)]">
                      {reportName || "Untitled Report"}
                    </h2>
                    <p className="text-[var(--sys-text-secondary)]">{reportDescription}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExport("pdf")}
                      disabled={isExporting}
                      className="px-4 py-2 bg-[var(--sys-accent)] text-white rounded-md hover:bg-[var(--sys-accent)]/90 focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] disabled:opacity-50"
                    >
                      <Download className="h-4 w-4 mr-2 inline" />
                      Export PDF
                    </button>
                    <button
                      onClick={() => handleExport("excel")}
                      disabled={isExporting}
                      className="px-4 py-2 border border-[var(--sys-border-hairline)] text-[var(--sys-text-primary)] rounded-md hover:bg-[var(--sys-bg-subtle)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)] disabled:opacity-50"
                    >
                      <FileText className="h-4 w-4 mr-2 inline" />
                      Export Excel
                    </button>
                  </div>
                </div>

                {/* Report Content Preview */}
                <div className="space-y-4">
                  {currentReport.sections
                    .sort((a, b) => a.order - b.order)
                    .map(section => (
                      <div
                        key={section.id}
                        className="p-4 border border-[var(--sys-border-hairline)] rounded-lg"
                      >
                        <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-2">
                          {section.title}
                        </h3>
                        <div className="text-sm text-[var(--sys-text-secondary)]">
                          {section.type === "header" && (
                            <p>Header content would be displayed here</p>
                          )}
                          {section.type === "table" && (
                            <p>Table with selected fields would be displayed here</p>
                          )}
                          {section.type === "chart" && (
                            <p>Chart visualization would be displayed here</p>
                          )}
                          {section.type === "summary" && (
                            <p>Summary statistics would be displayed here</p>
                          )}
                          {section.type === "narrative" && (
                            <p>Narrative text would be displayed here</p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            ) : (
              /* Edit Mode */
              <div className="space-y-4">
                <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
                  <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-4">
                    Report Sections
                  </h3>
                  <div className="space-y-2">
                    {currentReport.sections
                      .sort((a, b) => a.order - b.order)
                      .map((section, index) => (
                        <div
                          key={section.id}
                          className="flex items-center gap-3 p-3 border border-[var(--sys-border-hairline)] rounded-md hover:bg-[var(--sys-bg-subtle)]"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {getSectionIcon(section.type)}
                            <span className="text-sm font-medium text-[var(--sys-text-primary)]">
                              {section.title}
                            </span>
                            <span className="text-xs text-[var(--sys-text-secondary)]">
                              ({section.type})
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() =>
                                handleUpdateSection(section.id, { visible: !section.visible })
                              }
                              className="p-1 text-[var(--sys-text-secondary)] hover:text-[var(--sys-accent)]"
                              title={section.visible ? "Hide" : "Show"}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSection(section.id)}
                              className="p-1 text-[var(--sys-status-error)] hover:text-[var(--sys-status-error)]/80"
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Selected Fields */}
                <div className="bg-[var(--sys-bg-primary)] border border-[var(--sys-border-hairline)] rounded-lg p-4">
                  <h3 className="text-lg font-medium text-[var(--sys-text-primary)] mb-4">
                    Selected Fields
                  </h3>
                  <div className="space-y-2">
                    {currentReport.fields
                      .sort((a, b) => a.order - b.order)
                      .map(field => (
                        <div
                          key={field.id}
                          className="flex items-center gap-3 p-2 border border-[var(--sys-border-hairline)] rounded-md"
                        >
                          <div className="flex items-center gap-2 flex-1">
                            {getFieldTypeIcon(field.type)}
                            <span className="text-sm text-[var(--sys-text-primary)]">
                              {field.label}
                            </span>
                            <span className="text-xs text-[var(--sys-text-secondary)]">
                              ({field.type})
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                const updatedFields = currentReport.fields.map(f =>
                                  f.id === field.id ? { ...f, visible: !f.visible } : f,
                                );
                                setCurrentReport({ ...currentReport, fields: updatedFields });
                              }}
                              className="p-1 text-[var(--sys-text-secondary)] hover:text-[var(--sys-accent)]"
                              title={field.visible ? "Hide" : "Show"}
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => {
                                const updatedFields = currentReport.fields.filter(
                                  f => f.id !== field.id,
                                );
                                setCurrentReport({ ...currentReport, fields: updatedFields });
                              }}
                              className="p-1 text-[var(--sys-status-error)] hover:text-[var(--sys-status-error)]/80"
                              title="Remove"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
