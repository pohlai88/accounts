/**
 * Amount Input Component
 * Specialized input for financial amounts with currency formatting and validation
 */

"use client";

import * as React from "react";
import { DollarSign, Calculator, TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface AmountInputProps {
  value?: number;
  onChange?: (value: number | undefined) => void;
  currency?: string;
  onCurrencyChange?: (currency: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  required?: boolean;

  // Formatting options
  showCurrency?: boolean;
  showSymbol?: boolean;
  decimalPlaces?: number;
  thousandSeparator?: string;
  decimalSeparator?: string;

  // Validation
  min?: number;
  max?: number;
  allowNegative?: boolean;

  // Business features
  showCalculator?: boolean;
  showTrend?: "up" | "down" | null;
  comparisonValue?: number;
  quickAmounts?: number[];

  // Multi-currency
  availableCurrencies?: string[];
  exchangeRate?: number;
  baseCurrency?: string;
}

const COMMON_CURRENCIES = [
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "JPY", symbol: "¥", name: "Japanese Yen" },
];

export function AmountInput({
  value,
  onChange,
  currency = "MYR",
  onCurrencyChange,
  placeholder = "0.00",
  disabled = false,
  className,
  label,
  error,
  required = false,
  showCurrency = true,
  showSymbol = true,
  decimalPlaces = 2,
  thousandSeparator = ",",
  decimalSeparator = ".",
  min,
  max,
  allowNegative = false,
  showCalculator = false,
  showTrend = null,
  comparisonValue,
  quickAmounts = [],
  availableCurrencies = ["MYR", "USD", "EUR", "GBP"],
  exchangeRate,
  baseCurrency,
}: AmountInputProps) {
  const [displayValue, setDisplayValue] = React.useState("");
  const [isFocused, setIsFocused] = React.useState(false);
  const [showQuickAmounts, setShowQuickAmounts] = React.useState(false);

  const currencyInfo = COMMON_CURRENCIES.find(c => c.code === currency) || COMMON_CURRENCIES[0];

  // Format number for display
  const formatAmount = (amount: number | undefined): string => {
    if (amount === undefined || amount === null || isNaN(amount)) return "";

    const formatted = new Intl.NumberFormat("en-MY", {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces,
      useGrouping: true,
    }).format(Math.abs(amount));

    return allowNegative && amount < 0 ? `-${formatted}` : formatted;
  };

  // Parse display value to number
  const parseAmount = (text: string): number | undefined => {
    if (!text.trim()) return undefined;

    // Remove formatting
    const cleanText = text
      .replace(new RegExp(`\\${thousandSeparator}`, "g"), "")
      .replace(new RegExp(`\\${decimalSeparator}`), ".")
      .replace(/[^\d.-]/g, "");

    const parsed = parseFloat(cleanText);
    return isNaN(parsed) ? undefined : parsed;
  };

  // Update display value when value prop changes
  React.useEffect(() => {
    if (!isFocused) {
      setDisplayValue(formatAmount(value));
    }
  }, [value, isFocused, decimalPlaces, thousandSeparator]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);

    const parsed = parseAmount(inputValue);

    // Validate range
    if (parsed !== undefined) {
      if (min !== undefined && parsed < min) return;
      if (max !== undefined && parsed > max) return;
      if (!allowNegative && parsed < 0) return;
    }

    onChange?.(parsed);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number when focused
    if (value !== undefined) {
      setDisplayValue(value.toString());
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format when blurred
    setDisplayValue(formatAmount(value));
  };

  const handleQuickAmount = (amount: number) => {
    onChange?.(amount);
    setShowQuickAmounts(false);
  };

  const calculateTrend = () => {
    if (!comparisonValue || !value) return null;

    const percentChange = ((value - comparisonValue) / comparisonValue) * 100;
    return {
      direction: percentChange > 0 ? "up" : "down",
      percentage: Math.abs(percentChange),
    };
  };

  const trend = calculateTrend();

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <div className="relative">
        {/* Currency selector */}
        {showCurrency && availableCurrencies.length > 1 && (
          <div className="absolute left-2 top-1/2 transform -translate-y-1/2 z-10">
            <Select value={currency} onValueChange={onCurrencyChange}>
              <SelectTrigger className="w-20 h-8 border-0 bg-transparent p-0 focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableCurrencies.map(curr => {
                  const info = COMMON_CURRENCIES.find(c => c.code === curr);
                  return (
                    <SelectItem key={curr} value={curr}>
                      <div className="flex items-center space-x-2">
                        <span className="font-mono">{curr}</span>
                        {info && (
                          <span className="text-xs text-muted-foreground">{info.symbol}</span>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Currency symbol */}
        {showSymbol && !showCurrency && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
            {currencyInfo.symbol}
          </div>
        )}

        {/* Main input */}
        <Input
          type="text"
          value={displayValue}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          className={cn(
            "text-right font-mono",
            (showCurrency || showSymbol) && "pl-16",
            showCalculator && "pr-20",
            error && "border-red-500 focus:ring-red-500",
          )}
        />

        {/* Calculator button */}
        {showCalculator && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
            onClick={() => setShowQuickAmounts(!showQuickAmounts)}
          >
            <Calculator className="h-4 w-4" />
          </Button>
        )}

        {/* Trend indicator */}
        {showTrend && trend && (
          <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
            {trend.direction === "up" ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </div>
        )}
      </div>

      {/* Quick amounts */}
      {showQuickAmounts && quickAmounts.length > 0 && (
        <div className="flex flex-wrap gap-1 p-2 bg-muted rounded-md">
          {quickAmounts.map((amount, index) => (
            <Button
              key={index}
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => handleQuickAmount(amount)}
            >
              {currencyInfo.symbol}
              {formatAmount(amount)}
            </Button>
          ))}
        </div>
      )}

      {/* Exchange rate info */}
      {exchangeRate && baseCurrency && currency !== baseCurrency && value && (
        <div className="text-xs text-muted-foreground">
          ≈ {baseCurrency} {(value * exchangeRate).toLocaleString()}
          <span className="ml-1">(Rate: {exchangeRate})</span>
        </div>
      )}

      {/* Trend comparison */}
      {trend && comparisonValue && (
        <div className="text-xs text-muted-foreground flex items-center space-x-1">
          {trend.direction === "up" ? (
            <TrendingUp className="h-3 w-3 text-green-500" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500" />
          )}
          <span>
            {trend.percentage.toFixed(1)}% vs {currencyInfo.symbol}
            {formatAmount(comparisonValue)}
          </span>
        </div>
      )}

      {/* Validation error */}
      {error && <p className="text-sm text-red-500">{error}</p>}

      {/* Range info */}
      {(min !== undefined || max !== undefined) && (
        <div className="text-xs text-muted-foreground">
          {min !== undefined && max !== undefined && (
            <>
              Range: {currencyInfo.symbol}
              {formatAmount(min)} - {currencyInfo.symbol}
              {formatAmount(max)}
            </>
          )}
          {min !== undefined && max === undefined && (
            <>
              Minimum: {currencyInfo.symbol}
              {formatAmount(min)}
            </>
          )}
          {min === undefined && max !== undefined && (
            <>
              Maximum: {currencyInfo.symbol}
              {formatAmount(max)}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// Multi-amount input for transactions with multiple line items
export interface MultiAmountInputProps {
  items: Array<{
    id: string;
    label: string;
    amount?: number;
    currency?: string;
  }>;
  onChange?: (items: Array<{ id: string; amount?: number; currency?: string }>) => void;
  baseCurrency?: string;
  showTotal?: boolean;
  className?: string;
}

export function MultiAmountInput({
  items,
  onChange,
  baseCurrency = "MYR",
  showTotal = true,
  className,
}: MultiAmountInputProps) {
  const handleItemChange = (id: string, amount?: number, currency?: string) => {
    const updatedItems = items.map(item =>
      item.id === id
        ? { id, amount, currency: currency || item.currency || baseCurrency }
        : { id: item.id, amount: item.amount, currency: item.currency },
    );
    onChange?.(updatedItems);
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => {
      if (item.amount && item.currency === baseCurrency) {
        return sum + item.amount;
      }
      return sum;
    }, 0);
  };

  return (
    <div className={cn("space-y-3", className)}>
      {items.map((item, index) => (
        <div key={item.id} className="flex items-center space-x-3">
          <div className="flex-1">
            <AmountInput
              value={item.amount}
              currency={item.currency || baseCurrency}
              onChange={amount => handleItemChange(item.id, amount)}
              onCurrencyChange={currency => handleItemChange(item.id, item.amount, currency)}
              label={item.label}
              showCurrency={true}
            />
          </div>
        </div>
      ))}

      {showTotal && items.length > 1 && (
        <div className="border-t pt-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">Total ({baseCurrency}):</span>
            <span className="text-lg font-bold">
              {COMMON_CURRENCIES.find(c => c.code === baseCurrency)?.symbol}
              {calculateTotal().toLocaleString()}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
