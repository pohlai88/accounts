'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@aibos/ui/utils';
import { Button } from '@aibos/ui/Button';
import { Input } from '@aibos/ui/Input';
import { Label } from '@aibos/ui/Label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@aibos/ui/Card';
import { Badge } from '@aibos/ui/Badge';
import { Alert, AlertDescription } from '@aibos/ui/Alert';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  BarChart3,
  PieChart,
  Target,
  AlertCircle,
  CheckCircle,
  Clock,
  Filter,
  Download,
  RefreshCw,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
  Minus,
  Activity,
  Zap,
  Loader2
} from 'lucide-react';

// Types
interface CashFlowData {
  date: string;
  inflow: number;
  outflow: number;
  netFlow: number;
  runningBalance: number;
  category: string;
  description: string;
}

interface ForecastData {
  date: string;
  predictedInflow: number;
  predictedOutflow: number;
  predictedNetFlow: number;
  predictedBalance: number;
  confidence: number;
  scenario: 'optimistic' | 'realistic' | 'pessimistic';
}

interface CashFlowMetrics {
  totalInflow: number;
  totalOutflow: number;
  netCashFlow: number;
  averageDailyFlow: number;
  cashRunway: number; // days
  burnRate: number; // daily
  growthRate: number; // percentage
  volatility: number; // percentage
}

interface CashFlowAnalysisProps {
  onForecastGenerated?: (forecast: ForecastData[]) => void;
  onMetricsCalculated?: (metrics: CashFlowMetrics) => void;
  onExportRequested?: (format: 'csv' | 'pdf') => void;
  className?: string;
}

// Mock data
const mockCashFlowData: CashFlowData[] = [
  {
    date: '2024-01-01',
    inflow: 5000.00,
    outflow: 2500.00,
    netFlow: 2500.00,
    runningBalance: 2500.00,
    category: 'Revenue',
    description: 'Client payment received'
  },
  {
    date: '2024-01-02',
    inflow: 0.00,
    outflow: 89.50,
    netFlow: -89.50,
    runningBalance: 2410.50,
    category: 'Technology',
    description: 'AWS hosting fee'
  },
  {
    date: '2024-01-03',
    inflow: 0.00,
    outflow: 12.50,
    netFlow: -12.50,
    runningBalance: 2398.00,
    category: 'Meals',
    description: 'Business meal'
  },
  {
    date: '2024-01-04',
    inflow: 0.00,
    outflow: 8500.00,
    netFlow: -8500.00,
    runningBalance: -6102.00,
    category: 'Payroll',
    description: 'Employee salaries'
  },
  {
    date: '2024-01-05',
    inflow: 3000.00,
    outflow: 0.00,
    netFlow: 3000.00,
    runningBalance: -3102.00,
    category: 'Revenue',
    description: 'Client payment received'
  },
  {
    date: '2024-01-06',
    inflow: 0.00,
    outflow: 150.00,
    netFlow: -150.00,
    runningBalance: -3252.00,
    category: 'Office',
    description: 'Office supplies'
  },
  {
    date: '2024-01-07',
    inflow: 0.00,
    outflow: 2500.00,
    netFlow: -2500.00,
    runningBalance: -5752.00,
    category: 'Rent',
    description: 'Office rent payment'
  },
  {
    date: '2024-01-08',
    inflow: 7500.00,
    outflow: 0.00,
    netFlow: 7500.00,
    runningBalance: 1748.00,
    category: 'Revenue',
    description: 'Large client payment'
  },
  {
    date: '2024-01-09',
    inflow: 0.00,
    outflow: 200.00,
    netFlow: -200.00,
    runningBalance: 1548.00,
    category: 'Marketing',
    description: 'Advertising spend'
  },
  {
    date: '2024-01-10',
    inflow: 0.00,
    outflow: 500.00,
    netFlow: -500.00,
    runningBalance: 1048.00,
    category: 'Legal',
    description: 'Legal consultation'
  }
];

const mockForecastData: ForecastData[] = [
  {
    date: '2024-01-11',
    predictedInflow: 4000.00,
    predictedOutflow: 1200.00,
    predictedNetFlow: 2800.00,
    predictedBalance: 3848.00,
    confidence: 0.85,
    scenario: 'realistic'
  },
  {
    date: '2024-01-12',
    predictedInflow: 0.00,
    predictedOutflow: 800.00,
    predictedNetFlow: -800.00,
    predictedBalance: 3048.00,
    confidence: 0.90,
    scenario: 'realistic'
  },
  {
    date: '2024-01-13',
    predictedInflow: 0.00,
    predictedOutflow: 600.00,
    predictedNetFlow: -600.00,
    predictedBalance: 2448.00,
    confidence: 0.88,
    scenario: 'realistic'
  },
  {
    date: '2024-01-14',
    predictedInflow: 0.00,
    predictedOutflow: 8500.00,
    predictedNetFlow: -8500.00,
    predictedBalance: -6052.00,
    confidence: 0.95,
    scenario: 'realistic'
  },
  {
    date: '2024-01-15',
    predictedInflow: 6000.00,
    predictedOutflow: 0.00,
    predictedNetFlow: 6000.00,
    predictedBalance: -52.00,
    confidence: 0.80,
    scenario: 'realistic'
  }
];

const mockMetrics: CashFlowMetrics = {
  totalInflow: 15500.00,
  totalOutflow: 15452.50,
  netCashFlow: 47.50,
  averageDailyFlow: 4.75,
  cashRunway: 220, // days
  burnRate: -154.53, // daily
  growthRate: 12.5, // percentage
  volatility: 8.2 // percentage
};

export function CashFlowAnalysis({
  onForecastGenerated,
  onMetricsCalculated,
  onExportRequested,
  className
}: CashFlowAnalysisProps) {
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>(mockCashFlowData);
  const [forecastData, setForecastData] = useState<ForecastData[]>(mockForecastData);
  const [metrics, setMetrics] = useState<CashFlowMetrics>(mockMetrics);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d' | '1y'>('30d');
  const [selectedScenario, setSelectedScenario] = useState<'optimistic' | 'realistic' | 'pessimistic'>('realistic');
  const [showForecast, setShowForecast] = useState(true);
  const [showMetrics, setShowMetrics] = useState(true);
  const [isGeneratingForecast, setIsGeneratingForecast] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Filter data based on selected period
  const filteredData = cashFlowData.filter(item => {
    const itemDate = new Date(item.date);
    const now = new Date();
    const daysDiff = Math.floor((now.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24));

    switch (selectedPeriod) {
      case '7d': return daysDiff <= 7;
      case '30d': return daysDiff <= 30;
      case '90d': return daysDiff <= 90;
      case '1y': return daysDiff <= 365;
      default: return true;
    }
  });

  // Filter by category
  const categoryFilteredData = filteredData.filter(item =>
    filterCategory === 'all' || item.category === filterCategory
  );

  const handleGenerateForecast = async () => {
    setIsGeneratingForecast(true);

    // Simulate forecast generation
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Generate new forecast data based on historical patterns
    const newForecast: ForecastData[] = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() + index + 1);

      const baseInflow = 2000 + Math.random() * 3000;
      const baseOutflow = 500 + Math.random() * 1000;

      return {
        date: date.toISOString().split('T')[0] || '',
        predictedInflow: Math.round(baseInflow * 100) / 100,
        predictedOutflow: Math.round(baseOutflow * 100) / 100,
        predictedNetFlow: Math.round((baseInflow - baseOutflow) * 100) / 100,
        predictedBalance: Math.round((1000 + (baseInflow - baseOutflow) * (index + 1)) * 100) / 100,
        confidence: 0.75 + Math.random() * 0.2,
        scenario: selectedScenario
      };
    });

    setForecastData(newForecast);
    setIsGeneratingForecast(false);

    if (onForecastGenerated) {
      onForecastGenerated(newForecast);
    }
  };

  const handleExport = (format: 'csv' | 'pdf') => {
    if (onExportRequested) {
      onExportRequested(format);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getFlowIcon = (netFlow: number) => {
    if (netFlow > 0) return <ArrowUp className="w-4 h-4 text-sys-green-600" />;
    if (netFlow < 0) return <ArrowDown className="w-4 h-4 text-sys-red-600" />;
    return <Minus className="w-4 h-4 text-sys-gray-600" />;
  };

  const getFlowColor = (netFlow: number) => {
    if (netFlow > 0) return 'text-sys-green-600';
    if (netFlow < 0) return 'text-sys-red-600';
    return 'text-sys-gray-600';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-sys-green-600';
    if (confidence >= 0.6) return 'text-sys-yellow-600';
    return 'text-sys-red-600';
  };

  const getScenarioColor = (scenario: string) => {
    switch (scenario) {
      case 'optimistic': return 'bg-sys-green-100 text-sys-green-800 border-sys-green-200';
      case 'realistic': return 'bg-sys-blue-100 text-sys-blue-800 border-sys-blue-200';
      case 'pessimistic': return 'bg-sys-red-100 text-sys-red-800 border-sys-red-200';
      default: return 'bg-sys-gray-100 text-sys-gray-800 border-sys-gray-200';
    }
  };

  const categories = Array.from(new Set(cashFlowData.map(item => item.category)));

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-sys-fg-default">Cash Flow Analysis</h2>
        <p className="text-sys-fg-muted">
          Analyze cash flow patterns, generate forecasts, and track key financial metrics.
        </p>
      </div>

      {/* Key Metrics */}
      {showMetrics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-sys-green-600" />
                <div>
                  <p className="text-2xl font-bold text-sys-fg-default">{formatCurrency(metrics.netCashFlow)}</p>
                  <p className="text-sm text-sys-fg-muted">Net Cash Flow</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Clock className="w-8 h-8 text-sys-blue-600" />
                <div>
                  <p className="text-2xl font-bold text-sys-fg-default">{metrics.cashRunway}</p>
                  <p className="text-sm text-sys-fg-muted">Cash Runway (days)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Target className="w-8 h-8 text-sys-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-sys-fg-default">{formatPercentage(metrics.growthRate)}</p>
                  <p className="text-sm text-sys-fg-muted">Growth Rate</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <Activity className="w-8 h-8 text-sys-orange-600" />
                <div>
                  <p className="text-2xl font-bold text-sys-fg-default">{formatPercentage(metrics.volatility)}</p>
                  <p className="text-sm text-sys-fg-muted">Volatility</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Controls */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-sys-brand-600" />
                Analysis Controls
              </CardTitle>
              <CardDescription>
                Configure analysis parameters and generate forecasts.
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowMetrics(!showMetrics)}
              >
                {showMetrics ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showMetrics ? 'Hide Metrics' : 'Show Metrics'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowForecast(!showForecast)}
              >
                {showForecast ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                {showForecast ? 'Hide Forecast' : 'Show Forecast'}
              </Button>
              <Button
                onClick={handleGenerateForecast}
                disabled={isGeneratingForecast}
                className="flex items-center gap-2"
              >
                {isGeneratingForecast ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    Generate Forecast
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex gap-4 mb-6">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="px-3 py-2 border border-sys-border rounded-md bg-sys-bg-default text-sys-fg-default"
            >
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
              <option value="1y">Last Year</option>
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-sys-border rounded-md bg-sys-bg-default text-sys-fg-default"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={selectedScenario}
              onChange={(e) => setSelectedScenario(e.target.value as any)}
              className="px-3 py-2 border border-sys-border rounded-md bg-sys-bg-default text-sys-fg-default"
            >
              <option value="optimistic">Optimistic</option>
              <option value="realistic">Realistic</option>
              <option value="pessimistic">Pessimistic</option>
            </select>

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('csv')}
              >
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('pdf')}
              >
                <Download className="w-4 h-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cash Flow Data */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-sys-brand-600" />
            Cash Flow History
          </CardTitle>
          <CardDescription>
            {categoryFilteredData.length} transactions in the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {categoryFilteredData.map((item, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      {getFlowIcon(item.netFlow)}
                      <div>
                        <p className="font-medium text-sys-fg-default">{item.description}</p>
                        <p className="text-sm text-sys-fg-muted">
                          {item.date} • {item.category}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-sm text-sys-fg-muted">Inflow</p>
                      <p className="font-medium text-sys-green-600">
                        {formatCurrency(item.inflow)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-sys-fg-muted">Outflow</p>
                      <p className="font-medium text-sys-red-600">
                        {formatCurrency(item.outflow)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-sys-fg-muted">Net Flow</p>
                      <p className={cn("font-medium", getFlowColor(item.netFlow))}>
                        {formatCurrency(item.netFlow)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-sys-fg-muted">Balance</p>
                      <p className="font-medium text-sys-fg-default">
                        {formatCurrency(item.runningBalance)}
                      </p>
                    </div>
                  </div>
                </div>
              </Card>
            ))}

            {categoryFilteredData.length === 0 && (
              <div className="text-center py-8 text-sys-fg-muted">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No cash flow data found for the selected period.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Forecast Data */}
      {showForecast && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-sys-brand-600" />
              Cash Flow Forecast
            </CardTitle>
            <CardDescription>
              Predicted cash flow for the next 14 days ({selectedScenario} scenario)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {forecastData.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        {getFlowIcon(item.predictedNetFlow)}
                        <div>
                          <p className="font-medium text-sys-fg-default">
                            Forecast for {item.date}
                          </p>
                          <p className="text-sm text-sys-fg-muted">
                            {selectedScenario} scenario
                          </p>
                        </div>
                      </div>

                      <Badge className={getScenarioColor(item.scenario)}>
                        {item.scenario}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <p className="text-sm text-sys-fg-muted">Predicted Inflow</p>
                        <p className="font-medium text-sys-green-600">
                          {formatCurrency(item.predictedInflow)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-sys-fg-muted">Predicted Outflow</p>
                        <p className="font-medium text-sys-red-600">
                          {formatCurrency(item.predictedOutflow)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-sys-fg-muted">Predicted Net</p>
                        <p className={cn("font-medium", getFlowColor(item.predictedNetFlow))}>
                          {formatCurrency(item.predictedNetFlow)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-sys-fg-muted">Predicted Balance</p>
                        <p className="font-medium text-sys-fg-default">
                          {formatCurrency(item.predictedBalance)}
                        </p>
                      </div>

                      <div className="text-right">
                        <p className="text-sm text-sys-fg-muted">Confidence</p>
                        <p className={cn("font-medium", getConfidenceColor(item.confidence))}>
                          {formatPercentage(item.confidence * 100)}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights and Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-sys-brand-600" />
            Insights & Recommendations
          </CardTitle>
          <CardDescription>
            AI-generated insights based on your cash flow patterns.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Alert className="border-sys-green-200">
              <CheckCircle className="w-4 h-4 text-sys-green-500" />
              <AlertDescription>
                <strong>Positive Trend:</strong> Your cash flow has improved by 12.5% over the last 30 days.
                Consider increasing your cash reserves to maintain this momentum.
              </AlertDescription>
            </Alert>

            <Alert className="border-sys-yellow-200">
              <AlertCircle className="w-4 h-4 text-sys-yellow-500" />
              <AlertDescription>
                <strong>Volatility Alert:</strong> Your cash flow shows 8.2% volatility.
                Consider smoothing out irregular payments to improve predictability.
              </AlertDescription>
            </Alert>

            <Alert className="border-sys-blue-200">
              <CheckCircle className="w-4 h-4 text-sys-blue-500" />
              <AlertDescription>
                <strong>Forecast Insight:</strong> Based on current trends, you have 220 days of cash runway.
                This provides good buffer for business operations and growth investments.
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
