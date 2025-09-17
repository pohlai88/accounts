/**
 * Advanced Date Picker Component
 * Professional date/range selection with business calendar features
 */
// @ts-nocheck


"use client";

import * as React from "react";
import { format, isValid, parse } from "date-fns";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { DayPicker } from "react-day-picker";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export interface DatePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  required?: boolean;
  minDate?: Date;
  maxDate?: Date;
  businessDaysOnly?: boolean;
  fiscalYearStart?: number; // Month (1-12)
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Select date",
  disabled = false,
  className,
  label,
  error,
  required = false,
  minDate,
  maxDate,
  businessDaysOnly = false,
  fiscalYearStart = 1, // January
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState("");

  // Update input when value changes
  React.useEffect(() => {
    if (value && isValid(value)) {
      setInputValue(format(value, "dd/MM/yyyy"));
    } else {
      setInputValue("");
    }
  }, [value]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);

    // Try to parse the input
    if (newValue.length === 10) {
      // dd/mm/yyyy
      const parsed = parse(newValue, "dd/MM/yyyy", new Date());
      if (isValid(parsed)) {
        onChange?.(parsed);
      }
    } else if (newValue === "") {
      onChange?.(undefined);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    onChange?.(date);
    setOpen(false);
  };

  const isBusinessDay = (date: Date) => {
    const day = date.getDay();
    return day !== 0 && day !== 6; // Not Sunday (0) or Saturday (6)
  };

  const disabledDays = React.useMemo(() => {
    const disabled: any[] = [];

    if (minDate) disabled.push({ before: minDate });
    if (maxDate) disabled.push({ after: maxDate });
    if (businessDaysOnly) disabled.push({ dayOfWeek: [0, 6] });

    return disabled;
  }, [minDate, maxDate, businessDaysOnly]);

  // Quick date selections for business use
  const quickSelections = [
    { label: "Today", value: new Date() },
    { label: "Yesterday", value: new Date(Date.now() - 24 * 60 * 60 * 1000) },
    {
      label: "Start of Month",
      value: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    },
    {
      label: "End of Month",
      value: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
    },
    {
      label: "Fiscal Year Start",
      value: new Date(new Date().getFullYear(), fiscalYearStart - 1, 1),
    },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <div className="relative">
            <Input
              value={inputValue}
              onChange={handleInputChange}
              placeholder={placeholder}
              disabled={disabled}
              className={cn("pl-10 pr-4", error && "border-red-500 focus:ring-red-500")}
            />
            <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          </div>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <h4 className="font-medium text-sm mb-2">Quick Select</h4>
            <div className="grid grid-cols-2 gap-1">
              {quickSelections.map(quick => (
                <Button
                  key={quick.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start text-xs h-8"
                  onClick={() => handleDateSelect(quick.value)}
                >
                  {quick.label}
                </Button>
              ))}
            </div>
          </div>

          <DayPicker
            mode="single"
            selected={value}
            onSelect={handleDateSelect}
            disabled={disabledDays}
            initialFocus
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: cn("h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn("h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
              IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
            }}
          />
        </PopoverContent>
      </Popover>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}

// Date Range Picker Component
export interface DateRangePickerProps {
  value?: { from: Date | undefined; to: Date | undefined };
  onChange?: (range: { from: Date | undefined; to: Date | undefined }) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  label?: string;
  error?: string;
  required?: boolean;
  maxRange?: number; // Maximum days between dates
  fiscalYearStart?: number;
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Select date range",
  disabled = false,
  className,
  label,
  error,
  required = false,
  maxRange,
  fiscalYearStart = 1,
}: DateRangePickerProps) {
  const [open, setOpen] = React.useState(false);

  const formatRange = (range: { from: Date | undefined; to: Date | undefined }) => {
    if (!range.from) return "";
    if (!range.to) return format(range.from, "dd/MM/yyyy");
    return `${format(range.from, "dd/MM/yyyy")} - ${format(range.to, "dd/MM/yyyy")}`;
  };

  // Business-specific date ranges
  const businessRanges = [
    {
      label: "This Month",
      value: {
        from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        to: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
      },
    },
    {
      label: "Last Month",
      value: {
        from: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
        to: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
      },
    },
    {
      label: "This Quarter",
      value: {
        from: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3, 1),
        to: new Date(new Date().getFullYear(), Math.floor(new Date().getMonth() / 3) * 3 + 3, 0),
      },
    },
    {
      label: "This Fiscal Year",
      value: {
        from: new Date(new Date().getFullYear(), fiscalYearStart - 1, 1),
        to: new Date(new Date().getFullYear() + 1, fiscalYearStart - 1, 0),
      },
    },
  ];

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label className="text-sm font-medium">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            disabled={disabled}
            className={cn(
              "w-full justify-start text-left font-normal",
              !value?.from && "text-muted-foreground",
              error && "border-red-500",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value?.from ? formatRange(value) : placeholder}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-0" align="start">
          <div className="p-3 border-b">
            <h4 className="font-medium text-sm mb-2">Business Periods</h4>
            <div className="grid grid-cols-1 gap-1">
              {businessRanges.map(range => (
                <Button
                  key={range.label}
                  variant="ghost"
                  size="sm"
                  className="justify-start text-xs h-8"
                  onClick={() => {
                    onChange?.(range.value);
                    setOpen(false);
                  }}
                >
                  {range.label}
                </Button>
              ))}
            </div>
          </div>

          <DayPicker
            mode="range"
            selected={value}
            onSelect={range => onChange?.(range || { from: undefined, to: undefined })}
            numberOfMonths={2}
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-sm font-medium",
              nav: "space-x-1 flex items-center",
              nav_button: cn("h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100"),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
              row: "flex w-full mt-2",
              cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
              day: cn("h-9 w-9 p-0 font-normal aria-selected:opacity-100"),
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
            components={{
              IconLeft: ({ ...props }) => <ChevronLeft className="h-4 w-4" />,
              IconRight: ({ ...props }) => <ChevronRight className="h-4 w-4" />,
            }}
          />
        </PopoverContent>
      </Popover>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
