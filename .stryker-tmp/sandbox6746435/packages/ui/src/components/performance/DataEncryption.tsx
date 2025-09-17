// @ts-nocheck
import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@aibos/ui/Card";
import { Button } from "@aibos/ui/Button";
import { Badge } from "@aibos/ui/Badge";
import { Alert } from "@aibos/ui/Alert";
import { cn } from "@aibos/ui/utils";
import {
  AlertTriangle,
  CheckCircle,
  Database,
  Eye,
  EyeOff,
  FileText,
  Key,
  Lock,
  RefreshCw,
  Shield,
  ShieldCheck,
  User,
  Zap,
  Download,
  Upload,
  Settings,
} from "lucide-react";

interface EncryptionStatus {
  id: string;
  name: string;
  status: "encrypted" | "unencrypted" | "partially-encrypted";
  algorithm: string;
  keySize: number;
  lastEncrypted: Date;
  compliance: "compliant" | "non-compliant" | "partial";
}

interface PrivacyCompliance {
  standard: string;
  status: "compliant" | "non-compliant" | "partial";
  score: number;
  lastAudit: Date;
  nextAudit: Date;
  requirements: {
    id: string;
    name: string;
    status: "met" | "not-met" | "partial";
    description: string;
  }[];
}

interface DataEncryptionProps {
  encryptionStatus: EncryptionStatus[];
  privacyCompliance: PrivacyCompliance[];
  onEncryptData: (dataId: string) => void;
  onRotateKeys: () => void;
  onGenerateReport: () => void;
  onUpdateCompliance: (standard: string, requirementId: string) => void;
}

export const DataEncryption: React.FC<DataEncryptionProps> = ({
  encryptionStatus,
  privacyCompliance,
  onEncryptData,
  onRotateKeys,
  onGenerateReport,
  onUpdateCompliance,
}) => {
  const [isRotatingKeys, setIsRotatingKeys] = useState(false);
  const [selectedStandard, setSelectedStandard] = useState<string>("all");

  const handleRotateKeys = async () => {
    setIsRotatingKeys(true);
    await onRotateKeys();
    setIsRotatingKeys(false);
  };

  const getEncryptionStatusColor = (status: string) => {
    switch (status) {
      case "encrypted":
        return "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10";
      case "partially-encrypted":
        return "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10";
      case "unencrypted":
        return "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10";
      default:
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
    }
  };

  const getComplianceColor = (status: string) => {
    switch (status) {
      case "compliant":
        return "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10";
      case "partial":
        return "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10";
      case "non-compliant":
        return "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10";
      default:
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
    }
  };

  const getRequirementStatusColor = (status: string) => {
    switch (status) {
      case "met":
        return "text-[var(--sys-status-success)] bg-[var(--sys-status-success)]/10";
      case "partial":
        return "text-[var(--sys-status-warning)] bg-[var(--sys-status-warning)]/10";
      case "not-met":
        return "text-[var(--sys-status-error)] bg-[var(--sys-status-error)]/10";
      default:
        return "text-[var(--sys-text-tertiary)] bg-[var(--sys-fill-low)]";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "encrypted":
        return ShieldCheck;
      case "partially-encrypted":
        return AlertTriangle;
      case "unencrypted":
        return Shield;
      default:
        return Shield;
    }
  };

  const filteredCompliance =
    selectedStandard === "all"
      ? privacyCompliance
      : privacyCompliance.filter(c => c.standard === selectedStandard);

  const totalDataSources = encryptionStatus.length;
  const encryptedSources = encryptionStatus.filter(s => s.status === "encrypted").length;
  const unencryptedSources = encryptionStatus.filter(s => s.status === "unencrypted").length;
  const partiallyEncryptedSources = encryptionStatus.filter(
    s => s.status === "partially-encrypted",
  ).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-[var(--sys-text-primary)]">
            Data Encryption & Privacy
          </h2>
          <p className="text-[var(--sys-text-secondary)] mt-1">
            Comprehensive data protection and privacy compliance management
          </p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            onClick={handleRotateKeys}
            disabled={isRotatingKeys}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className={cn("h-4 w-4", isRotatingKeys && "animate-spin")} />
            <span>Rotate Keys</span>
          </Button>
          <Button
            onClick={onGenerateReport}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <FileText className="h-4 w-4" />
            <span>Generate Report</span>
          </Button>
        </div>
      </div>

      {/* Encryption Alerts */}
      {unencryptedSources > 0 && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <div>
            <h4 className="font-medium">Unencrypted Data Detected</h4>
            <p className="text-sm">
              {unencryptedSources} data sources are not encrypted and require immediate attention.
            </p>
          </div>
        </Alert>
      )}

      {/* Encryption Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Total Data Sources</div>
              <Database className="h-4 w-4 text-[var(--sys-text-tertiary)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
              {totalDataSources}
            </div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">All data sources</div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Encrypted</div>
              <ShieldCheck className="h-4 w-4 text-[var(--sys-status-success)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--sys-status-success)]">
              {encryptedSources}
            </div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">
              {Math.round((encryptedSources / totalDataSources) * 100)}% of total
            </div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Partially Encrypted</div>
              <AlertTriangle className="h-4 w-4 text-[var(--sys-status-warning)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--sys-status-warning)]">
              {partiallyEncryptedSources}
            </div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">Needs attention</div>
          </CardContent>
        </Card>

        <Card className="p-4">
          <CardContent className="p-0">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-[var(--sys-text-secondary)]">Unencrypted</div>
              <Shield className="h-4 w-4 text-[var(--sys-status-error)]" />
            </div>
            <div className="text-2xl font-bold text-[var(--sys-status-error)]">
              {unencryptedSources}
            </div>
            <div className="text-xs text-[var(--sys-text-tertiary)]">Critical risk</div>
          </CardContent>
        </Card>
      </div>

      {/* Encryption Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Lock className="h-5 w-5" />
            <span>Encryption Status</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {encryptionStatus.map(item => {
              const StatusIcon = getStatusIcon(item.status);
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between p-4 border border-[var(--sys-border-hairline)] rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    <StatusIcon className="h-5 w-5" />
                    <div>
                      <h4 className="font-medium text-[var(--sys-text-primary)]">{item.name}</h4>
                      <p className="text-sm text-[var(--sys-text-secondary)]">
                        {item.algorithm} ({item.keySize} bits) | Last encrypted:{" "}
                        {item.lastEncrypted.toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        getEncryptionStatusColor(item.status),
                      )}
                    >
                      {item.status.replace("-", " ").toUpperCase()}
                    </div>
                    <div
                      className={cn(
                        "px-2 py-1 rounded-full text-xs font-medium",
                        getComplianceColor(item.compliance),
                      )}
                    >
                      {item.compliance.toUpperCase()}
                    </div>
                    {item.status !== "encrypted" && (
                      <Button
                        size="sm"
                        onClick={() => onEncryptData(item.id)}
                        className="flex items-center space-x-1"
                      >
                        <Lock className="h-3 w-3" />
                        <span>Encrypt</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Privacy Compliance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <User className="h-5 w-5" />
            <span>Privacy Compliance</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Compliance Filter */}
            <div className="flex items-center space-x-4">
              <select
                value={selectedStandard}
                onChange={e => setSelectedStandard(e.target.value)}
                className="px-3 py-2 border border-[var(--sys-border-hairline)] rounded-lg bg-[var(--sys-bg-primary)] text-[var(--sys-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--sys-accent)]"
                aria-label="Filter by compliance standard"
              >
                <option value="all">All Standards</option>
                <option value="GDPR">GDPR</option>
                <option value="CCPA">CCPA</option>
                <option value="HIPAA">HIPAA</option>
                <option value="SOC 2">SOC 2</option>
                <option value="ISO 27001">ISO 27001</option>
              </select>
            </div>

            {/* Compliance Standards */}
            <div className="space-y-4">
              {filteredCompliance.map(standard => (
                <div
                  key={standard.standard}
                  className="border border-[var(--sys-border-hairline)] rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div
                        className={cn(
                          "px-2 py-1 rounded-full text-xs font-medium",
                          getComplianceColor(standard.status),
                        )}
                      >
                        {standard.status.toUpperCase()}
                      </div>
                      <h4 className="font-medium text-[var(--sys-text-primary)]">
                        {standard.standard}
                      </h4>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-[var(--sys-text-primary)]">
                        {standard.score}%
                      </div>
                      <div className="text-xs text-[var(--sys-text-tertiary)]">
                        Compliance Score
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {standard.requirements.map(requirement => (
                      <div
                        key={requirement.id}
                        className="flex items-center justify-between p-3 bg-[var(--sys-fill-low)] rounded-lg"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={cn(
                              "px-2 py-1 rounded-full text-xs font-medium",
                              getRequirementStatusColor(requirement.status),
                            )}
                          >
                            {requirement.status.replace("-", " ").toUpperCase()}
                          </div>
                          <div>
                            <h5 className="font-medium text-[var(--sys-text-primary)]">
                              {requirement.name}
                            </h5>
                            <p className="text-sm text-[var(--sys-text-secondary)]">
                              {requirement.description}
                            </p>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onUpdateCompliance(standard.standard, requirement.id)}
                          disabled={requirement.status === "met"}
                        >
                          {requirement.status === "met" ? "Met" : "Update"}
                        </Button>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-[var(--sys-border-hairline)] text-xs text-[var(--sys-text-tertiary)]">
                    Last audit: {standard.lastAudit.toLocaleDateString()} | Next audit:{" "}
                    {standard.nextAudit.toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Encryption Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5" />
            <span>Security Recommendations</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-[var(--sys-text-primary)]">
                Encryption Best Practices
              </h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Use AES-256 encryption
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Industry standard for data encryption
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Implement key rotation
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Rotate encryption keys every 90 days
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Encrypt data at rest
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      All stored data should be encrypted
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Use TLS for data in transit
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Secure all network communications
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-[var(--sys-text-primary)]">Privacy Compliance</h4>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Data minimization
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Collect only necessary data
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Consent management
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Clear consent for data processing
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Right to deletion
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Implement data deletion requests
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="h-4 w-4 text-[var(--sys-status-success)] mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-[var(--sys-text-primary)]">
                      Data breach notification
                    </p>
                    <p className="text-xs text-[var(--sys-text-secondary)]">
                      Notify authorities within 72 hours
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
