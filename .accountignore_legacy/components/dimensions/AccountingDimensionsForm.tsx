/**
 * Accounting Dimensions Form Component
 * Dynamic form fields for flexible accounting dimensions
 */

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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Grid3X3,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Info,
  Settings,
  Tag,
} from "lucide-react";
import { AccountingDimensionsService } from "@/lib/accounting-dimensions-service";

interface AccountingDimension {
  id: string;
  dimensionName: string;
  fieldname: string;
  label: string;
  documentType: string;
  isMandatory: boolean;
  disabled: boolean;
}

interface DimensionValue {
  dimensionId: string;
  fieldname: string;
  label: string;
  value: string;
  isMandatory: boolean;
}

interface AccountingDimensionsFormProps {
  companyId: string;
  documentType: string;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  errors?: Record<string, string>;
  disabled?: boolean;
  className?: string;
}

export function AccountingDimensionsForm({
  companyId,
  documentType,
  values,
  onChange,
  errors = {},
  disabled = false,
  className = "",
}: AccountingDimensionsFormProps) {
  const [dimensions, setDimensions] = useState<AccountingDimension[]>([]);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Load applicable dimensions
  useEffect(() => {
    loadDimensions();
  }, [companyId, documentType]);

  const loadDimensions = async () => {
    setLoading(true);
    try {
      const result = await AccountingDimensionsService.getAccountingDimensions(
        companyId,
        documentType,
      );

      if (result.success && result.data) {
        setDimensions(result.data);
      }
    } catch (error) {
      console.error("Failed to load dimensions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDimensionChange = (fieldname: string, value: string) => {
    const newValues = { ...values, [fieldname]: value };
    onChange(newValues);

    // Clear validation error for this field
    if (validationErrors.includes(fieldname)) {
      setValidationErrors(validationErrors.filter(err => err !== fieldname));
    }
  };

  const validateDimensions = async () => {
    const errors: string[] = [];

    for (const dimension of dimensions) {
      if (dimension.isMandatory && !values[dimension.fieldname]) {
        errors.push(`${dimension.label} is required`);
      }
    }

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Validate on value changes
  useEffect(() => {
    if (dimensions.length > 0) {
      validateDimensions();
    }
  }, [values, dimensions]);

  if (loading) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-sm text-gray-600">Loading dimensions...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (dimensions.length === 0) {
    return null; // No dimensions configured for this document type
  }

  return (
    <Card className={className}>
      <CardHeader className="pb-4">
        <div className="flex items-center">
          <Grid3X3 className="h-5 w-5 mr-2 text-blue-500" />
          <CardTitle className="text-lg">Accounting Dimensions</CardTitle>
        </div>
        <CardDescription>Additional dimensions for detailed reporting and analysis</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {validationErrors.length > 0 && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <ul className="list-disc list-inside space-y-1">
                {validationErrors.map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dimensions.map(dimension => (
            <DimensionField
              key={dimension.id}
              dimension={dimension}
              value={values[dimension.fieldname] || ""}
              onChange={value => handleDimensionChange(dimension.fieldname, value)}
              error={errors[dimension.fieldname]}
              disabled={disabled}
            />
          ))}
        </div>

        {/* Dimension Summary */}
        {Object.keys(values).length > 0 && (
          <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-md">
            <h4 className="text-sm font-medium mb-2 flex items-center">
              <Tag className="h-4 w-4 mr-2" />
              Applied Dimensions
            </h4>
            <div className="flex flex-wrap gap-2">
              {dimensions
                .filter(dim => values[dim.fieldname])
                .map(dim => (
                  <Badge key={dim.id} variant="secondary" className="text-xs">
                    {dim.label}: {values[dim.fieldname]}
                  </Badge>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface DimensionFieldProps {
  dimension: AccountingDimension;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}

function DimensionField({ dimension, value, onChange, error, disabled }: DimensionFieldProps) {
  const [options, setOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [loading, setLoading] = useState(false);

  // Load dimension values (this would come from your dimension service)
  useEffect(() => {
    loadDimensionValues();
  }, [dimension.id]);

  const loadDimensionValues = async () => {
    setLoading(true);
    try {
      // Mock data - in real implementation, this would call your service
      const mockOptions = [
        { value: "dept1", label: "Sales Department" },
        { value: "dept2", label: "Marketing Department" },
        { value: "dept3", label: "Operations Department" },
      ];
      setOptions(mockOptions);
    } catch (error) {
      console.error("Failed to load dimension values:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm font-medium">
        {dimension.label}
        {dimension.isMandatory && <span className="text-red-500 ml-1">*</span>}
      </Label>

      <Select value={value} onValueChange={onChange} disabled={disabled || loading}>
        <SelectTrigger className={error ? "border-red-500" : ""}>
          <SelectValue placeholder={`Select ${dimension.label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {loading ? (
            <SelectItem value="" disabled>
              Loading options...
            </SelectItem>
          ) : (
            <>
              <SelectItem value="">None</SelectItem>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </>
          )}
        </SelectContent>
      </Select>

      {error && (
        <p className="text-sm text-red-500 flex items-center">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {error}
        </p>
      )}

      {dimension.isMandatory && (
        <p className="text-xs text-gray-500 flex items-center">
          <Info className="h-3 w-3 mr-1" />
          This dimension is mandatory for {dimension.documentType}
        </p>
      )}
    </div>
  );
}

export default AccountingDimensionsForm;
