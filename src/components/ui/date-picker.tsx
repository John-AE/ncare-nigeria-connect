import * as React from "react";
import { CalendarIcon } from "lucide-react";
import DatePickerLib from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  date?: Date;
  onDateChange: (date: Date | null) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  className,
  disabled
}: DatePickerProps) {
  return (
    <div className={cn("relative w-full", className)}>
      <CalendarIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400 pointer-events-none" />
      <DatePickerLib
        selected={date || null}
        onChange={(date) => onDateChange(date)}
        placeholderText={placeholder}
        dateFormat="MMMM d, yyyy"
        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
        disabled={disabled}
      />
    </div>
  );
}
