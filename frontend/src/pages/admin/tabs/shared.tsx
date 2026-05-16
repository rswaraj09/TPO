import type { ReactNode } from "react";
import type { AcademicYear } from "@/lib/studentApi";

export const DEPARTMENTS = [
  "CSE",
  "COMPUTER",
  "ELECTRICAL",
  "MECHANICAL",
  "EXTC",
  "CIVIL",
] as const;

export const YEARS = [
  "FIRST_YEAR",
  "SECOND_YEAR",
  "THIRD_YEAR",
  "FOURTH_YEAR",
] as const;

export const YEAR_LABELS: Record<AcademicYear, string> = {
  FIRST_YEAR: "1st Year",
  SECOND_YEAR: "2nd Year",
  THIRD_YEAR: "3rd Year",
  FOURTH_YEAR: "4th Year",
};

export function Badge({
  children,
  variant = "default",
}: {
  children: ReactNode;
  variant?: "default" | "green" | "red" | "gray" | "yellow";
}) {
  const cls: Record<string, string> = {
    default: "bg-gray-100 text-gray-700",
    green: "bg-emerald-100 text-emerald-800",
    red: "bg-red-100 text-red-800",
    gray: "bg-gray-100 text-gray-600",
    yellow: "bg-amber-100 text-amber-800",
  };
  return (
    <span className={`text-xs px-2 py-0.5 rounded ${cls[variant]}`}>
      {children}
    </span>
  );
}

export interface FilterSelectProps {
  label: string;
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
  getLabel?: (o: string) => string;
}

export function FilterSelect({
  label,
  value,
  options,
  onChange,
  getLabel,
}: FilterSelectProps) {
  return (
    <div>
      <label className="text-xs text-muted-foreground">{label}</label>
      <select
        className="h-9 w-full rounded-md border bg-background px-3 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">All</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {getLabel ? getLabel(o) : o}
          </option>
        ))}
      </select>
    </div>
  );
}
