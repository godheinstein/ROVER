// Presentation helpers shared by the comparison, charts, and matrix views.
import type { RobotField } from "./robotFields";

// Stable palette assigned to robots by index for charts/legends.
export const CHART_PALETTE = [
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#10b981", // emerald
  "#f59e0b", // amber
  "#ef4444", // red
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#84cc16", // lime
];

export function robotColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length];
}

export const RECOMMENDATION_LABELS: Record<string, string> = {
  top: "Top Pick",
  strong: "Strong Choice",
  good: "Good Option",
  moderate: "Moderate",
  "not-recommended": "Limited Support",
};

// Tailwind classes for recommendation badges (light theme friendly).
export const RECOMMENDATION_CLASSES: Record<string, string> = {
  top: "bg-green-100 text-green-800 border-green-300",
  strong: "bg-blue-100 text-blue-800 border-blue-300",
  good: "bg-amber-100 text-amber-800 border-amber-300",
  moderate: "bg-slate-100 text-slate-700 border-slate-300",
  "not-recommended": "bg-red-100 text-red-700 border-red-300",
};

export const ROS2_LABELS: Record<string, string> = {
  native: "Native",
  "via-bridge": "Via Bridge",
  "official-driver": "Official Driver",
  "not-confirmed": "Not Confirmed",
  none: "None",
};

export const ROS2_CLASSES: Record<string, string> = {
  native: "bg-green-100 text-green-800 border-green-300",
  "official-driver": "bg-blue-100 text-blue-800 border-blue-300",
  "via-bridge": "bg-amber-100 text-amber-800 border-amber-300",
  "not-confirmed": "bg-slate-100 text-slate-700 border-slate-300",
  none: "bg-red-100 text-red-700 border-red-300",
};

const EMPTY = "—";

// Render a robot field value to a plain string for tables/tooltips.
export function formatFieldValue(robot: any, field: RobotField): string {
  const value = robot[field.key];
  if (value === null || value === undefined || value === "") return EMPTY;

  switch (field.format) {
    case "boolean":
      return value ? "Yes" : "No";
    case "list":
      return Array.isArray(value) && value.length ? value.join(", ") : EMPTY;
    case "ros2":
      return ROS2_LABELS[value] ?? String(value);
    case "recommendation":
      return RECOMMENDATION_LABELS[value] ?? String(value);
    case "number":
      return field.unit ? `${value} ${field.unit}` : String(value);
    default:
      return String(value);
  }
}
