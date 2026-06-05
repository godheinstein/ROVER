// Build and download a CSV of a comparison table (criteria as rows, one column
// per robot).
import { ROBOT_TYPE_LABELS, type RobotField } from "./robotFields";
import { ROS2_LABELS, RECOMMENDATION_LABELS } from "./robotDisplay";

function csvEscape(value: string): string {
  // Quote fields containing commas, quotes, or newlines; double embedded quotes.
  return /[",\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

function csvCell(robot: any, field: RobotField): string {
  const v = robot[field.key];
  if (v === null || v === undefined || v === "") return "";
  switch (field.format) {
    case "boolean":
      return v ? "Yes" : "No";
    case "list":
      return Array.isArray(v) ? v.join("; ") : String(v);
    case "links":
      return Array.isArray(v) ? v.map((l: any) => `${l.label} (${l.url})`).join("; ") : "";
    case "link":
      return String(v);
    case "ros2":
      return ROS2_LABELS[v] ?? String(v);
    case "recommendation":
      return RECOMMENDATION_LABELS[v] ?? String(v);
    case "type":
      return ROBOT_TYPE_LABELS[v] ?? String(v);
    default:
      return String(v); // text + number
  }
}

export function buildComparisonCsv(robots: any[], fields: RobotField[]): string {
  const header = ["Criterion", ...robots.map((r) => r.name)];
  const rows = fields.map((f) => {
    const label = f.unit ? `${f.label} (${f.unit})` : f.label;
    return [label, ...robots.map((r) => csvCell(r, f))];
  });
  return [header, ...rows].map((row) => row.map((cell) => csvEscape(String(cell))).join(",")).join("\r\n");
}

export function downloadCsv(filename: string, content: string): void {
  // Prepend a BOM so Excel reads UTF-8 (units, ² etc.) correctly.
  const blob = new Blob(["﻿" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
