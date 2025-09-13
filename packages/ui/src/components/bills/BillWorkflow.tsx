import React, { useState, useEffect } from 'react';
import { FileText, Eye, CheckCircle, Clock, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';
import { cn } from '@aibos/ui/utils';
import { BillForm } from './BillForm';
import { OCRDataExtractor } from './OCRDataExtractor';
import { ApprovalWorkflow } from './ApprovalWorkflow';
import { PaymentProcessor } from './PaymentProcessor';
import { VendorManager } from './VendorManager';
import { ExpenseCategorizer } from './ExpenseCategorizer';

export interface BillWorkflowProps {
    className?: string;
    initialStep?: 'create' | 'ocr' | 'approval' | 'payment' | 'vendor' | 'categorize';
    onWorkflowComplete?: (billId: string) => void;
    isLoading?: boolean;
}

export const BillWorkflow: React.FC<BillWorkflowProps> = ({
    className,
    initialStep = 'create',
    onWorkflowComplete,
    isLoading = false
}) => {
    const [currentStep, setCurrentStep] = useState(initialStep);
    const [billData, setBillData] = useState<any>(null);
    const [workflowData, setWorkflowData] = useState<any>({});

    const steps = [
        { id: 'create', label: 'Create Bill', icon: FileText },
        { id: 'ocr', label: 'OCR Extract', icon: Eye },
        { id: 'approval', label: 'Approval', icon: CheckCircle },
        { id: 'payment', label: 'Payment', icon: CheckCircle },
        { id: 'vendor', label: 'Vendor', icon: FileText },
        { id: 'categorize', label: 'Categorize', icon: FileText }
    ];

    const currentStepIndex = steps.findIndex(step => step.id === currentStep);

    const handleStepChange = (stepId: string) => {
        setCurrentStep(stepId as any);
    };

    const handleNext = () => {
        if (currentStepIndex < steps.length - 1) {
            const nextStep = steps[currentStepIndex + 1];
            if (nextStep) {
                setCurrentStep(nextStep.id as any);
            }
        }
    };

    const handlePrevious = () => {
        if (currentStepIndex > 0) {
            const prevStep = steps[currentStepIndex - 1];
            if (prevStep) {
                setCurrentStep(prevStep.id as any);
            }
        }
    };

    const handleBillSave = (data: any) => {
        setBillData(data);
        setWorkflowData((prev: any) => ({ ...prev, bill: data }));
        handleNext();
    };

    const handleOCRDataExtracted = (data: any) => {
        setWorkflowData((prev: any) => ({ ...prev, ocrData: data }));
        handleNext();
    };

    const handleApprovalComplete = (data: any) => {
        setWorkflowData((prev: any) => ({ ...prev, approval: data }));
        handleNext();
    };

    const handlePaymentComplete = (data: any) => {
        setWorkflowData((prev: any) => ({ ...prev, payment: data }));
        handleNext();
    };

    const handleVendorSelect = (vendor: any) => {
        setWorkflowData((prev: any) => ({ ...prev, vendor }));
        handleNext();
    };

    const handleCategorizationComplete = (data: any) => {
        setWorkflowData((prev: any) => ({ ...prev, categorization: data }));
        if (onWorkflowComplete) {
            onWorkflowComplete('bill_001');
        }
    };

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 'create':
                return (
                    <BillForm
                        onSave={handleBillSave}
                        onCancel={() => setCurrentStep('create')}
                        isLoading={isLoading}
                    />
                );
            case 'ocr':
                return (
                    <OCRDataExtractor
                        onDataExtracted={handleOCRDataExtracted}
                        onProcessingComplete={(result) => {
                            console.log('OCR Processing Complete:', result);
                        }}
                        isLoading={isLoading}
                    />
                );
            case 'approval':
                return (
                    <ApprovalWorkflow
                        currentUser={{
                            id: 'user_001',
                            name: 'John Doe',
                            role: 'Manager',
                            canApprove: true,
                            approvalLimit: 5000
                        }}
                        onApprove={(requestId, comments) => {
                            console.log('Approved:', requestId, comments);
                            handleApprovalComplete({ requestId, comments, status: 'approved' });
                        }}
                        onReject={(requestId, reason) => {
                            console.log('Rejected:', requestId, reason);
                            handleApprovalComplete({ requestId, reason, status: 'rejected' });
                        }}
                        onEscalate={(requestId, comments) => {
                            console.log('Escalated:', requestId, comments);
                            handleApprovalComplete({ requestId, comments, status: 'escalated' });
                        }}
                        isLoading={isLoading}
                    />
                );
            case 'payment':
                return (
                    <PaymentProcessor
                        billId="bill_001"
                        billNumber="BILL-2024-001"
                        vendorName="Amazon Web Services"
                        amount={2500.00}
                        dueDate="2024-02-15"
                        onPaymentProcessed={(paymentId) => {
                            console.log('Payment Processed:', paymentId);
                            handlePaymentComplete({ paymentId, status: 'processed' });
                        }}
                        onPaymentScheduled={(schedule) => {
                            console.log('Payment Scheduled:', schedule);
                            handlePaymentComplete({ schedule, status: 'scheduled' });
                        }}
                        isLoading={isLoading}
                    />
                );
            case 'vendor':
                return (
                    <VendorManager
                        onVendorSelect={handleVendorSelect}
                        onVendorCreate={(vendor) => {
                            console.log('Vendor Created:', vendor);
                        }}
                        onVendorUpdate={(vendorId, vendorData) => {
                            console.log('Vendor Updated:', vendorId, vendorData);
                        }}
                        onVendorDelete={(vendorId) => {
                            console.log('Vendor Deleted:', vendorId);
                        }}
                        isLoading={isLoading}
                    />
                );
            case 'categorize':
                return (
                    <ExpenseCategorizer
                        onCategoryCreate={(category) => {
                            console.log('Category Created:', category);
                        }}
                        onCategoryUpdate={(categoryId, categoryData) => {
                            console.log('Category Updated:', categoryId, categoryData);
                        }}
                        onCategoryDelete={(categoryId) => {
                            console.log('Category Deleted:', categoryId);
                        }}
                        onRuleCreate={(rule) => {
                            console.log('Rule Created:', rule);
                        }}
                        onRuleUpdate={(ruleId, ruleData) => {
                            console.log('Rule Updated:', ruleId, ruleData);
                        }}
                        onRuleDelete={(ruleId) => {
                            console.log('Rule Deleted:', ruleId);
                        }}
                        onCategorizeExpense={(expenseData) => {
                            console.log('Expense Categorized:', expenseData);
                            return 'category_001';
                        }}
                        isLoading={isLoading}
                    />
                );
            default:
                return null;
        }
    };

    if (isLoading) {
        return (
            <div className={cn('space-y-4', className)}>
                <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6 animate-pulse">
                    <div className="space-y-4">
                        <div className="h-4 bg-sys-fill-low rounded w-32"></div>
                        <div className="h-8 bg-sys-fill-low rounded w-full"></div>
                        <div className="h-4 bg-sys-fill-low rounded w-24"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={cn('space-y-6', className)}>
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                    <div className="p-2 bg-sys-status-info/10 rounded-lg">
                        <FileText className="h-6 w-6 text-sys-status-info" aria-hidden="true" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-semibold text-sys-text-primary">Bill Workflow</h1>
                        <p className="text-sm text-sys-text-tertiary">Complete bill processing workflow</p>
                    </div>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={handlePrevious}
                        disabled={currentStepIndex === 0}
                        className="btn btn-outline btn-sm"
                        aria-label="Previous step"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" aria-hidden="true" />
                        Previous
                    </button>
                    <button
                        onClick={handleNext}
                        disabled={currentStepIndex === steps.length - 1}
                        className="btn btn-outline btn-sm"
                        aria-label="Next step"
                    >
                        Next
                        <ArrowRight className="h-4 w-4 ml-2" aria-hidden="true" />
                    </button>
                </div>
            </div>

            {/* Progress Steps */}
            <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
                <div className="flex items-center justify-between">
                    {steps.map((step, index) => {
                        const Icon = step.icon;
                        const isActive = step.id === currentStep;
                        const isCompleted = index < currentStepIndex;
                        const isClickable = index <= currentStepIndex + 1;

                        return (
                            <div key={step.id} className="flex flex-col items-center">
                                <button
                                    onClick={() => isClickable && handleStepChange(step.id)}
                                    disabled={!isClickable}
                                    className={cn(
                                        'w-12 h-12 rounded-full flex items-center justify-center transition-colors',
                                        isActive && 'bg-sys-status-info text-white',
                                        isCompleted && !isActive && 'bg-sys-status-success text-white',
                                        !isActive && !isCompleted && 'bg-sys-fill-low text-sys-text-tertiary',
                                        isClickable && !isActive && !isCompleted && 'hover:bg-sys-fill-medium'
                                    )}
                                    aria-label={`${step.label} step`}
                                >
                                    <Icon className="h-5 w-5" aria-hidden="true" />
                                </button>
                                <span className={cn(
                                    'text-xs mt-2 text-center',
                                    isActive ? 'text-sys-status-info font-medium' : 'text-sys-text-tertiary'
                                )}>
                                    {step.label}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Current Step Content */}
            <div className="bg-sys-bg-raised border border-sys-border-hairline rounded-lg p-6">
                {renderCurrentStep()}
            </div>

            {/* Workflow Summary */}
            {Object.keys(workflowData).length > 0 && (
                <div className="bg-sys-fill-low border border-sys-border-hairline rounded-lg p-4">
                    <h3 className="text-sm font-medium text-sys-text-primary mb-2">Workflow Progress</h3>
                    <div className="space-y-1">
                        {Object.entries(workflowData).map(([key, value]) => (
                            <div key={key} className="flex items-center space-x-2 text-xs">
                                <CheckCircle className="h-3 w-3 text-sys-status-success" aria-hidden="true" />
                                <span className="text-sys-text-secondary capitalize">{key}</span>
                                <span className="text-sys-text-tertiary">completed</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
