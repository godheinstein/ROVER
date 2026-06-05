import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { robotColor, RECOMMENDATION_LABELS, RECOMMENDATION_CLASSES, formatFieldValue } from "@/lib/robotDisplay";
import { getField, type RobotField } from "@/lib/robotFields";

const SCORE_DIMENSIONS: { key: string; label: string }[] = [
  { key: "scoreRos2Support", label: "ROS2" },
  { key: "scoreSdkOpenness", label: "SDK" },
  { key: "scoreSimulationSupport", label: "Simulation" },
  { key: "scoreComputePower", label: "Compute" },
  { key: "scoreDeveloperCommunity", label: "Community" },
  { key: "scorePayloadCapability", label: "Payload" },
  { key: "scoreDexterity", label: "Dexterity" },
];

function hasAnyValue(robots: any[], key: string): boolean {
  return robots.some((r) => {
    const v = r[key];
    return v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && v.length === 0);
  });
}

export default function ComparisonCharts({
  robots,
  selectedFields,
}: {
  robots: any[];
  selectedFields: string[];
}) {
  if (robots.length === 0) return null;

  const showRadar = SCORE_DIMENSIONS.some((d) => hasAnyValue(robots, d.key));

  // Radar data: one row per dimension, one series per robot.
  const radarData = SCORE_DIMENSIONS.map((dim) => {
    const row: Record<string, any> = { dimension: dim.label };
    robots.forEach((r) => {
      row[r.name] = r[dim.key] ?? 0;
    });
    return row;
  });

  // Split the user's selected fields: numeric → bar charts, everything else → a table.
  const selected = selectedFields
    .map((k) => getField(k))
    .filter((f): f is RobotField => Boolean(f));
  const barFields = selected.filter((f) => f.format === "number" && hasAnyValue(robots, f.key));
  const tableFields = selected.filter((f) => f.format !== "number" && hasAnyValue(robots, f.key));

  return (
    <div className="space-y-6">
      {showRadar && (
        <Card>
          <CardHeader>
            <CardTitle>Capability Radar (curated 1–5 scores)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={380}>
              <RadarChart data={radarData} outerRadius="75%">
                <PolarGrid />
                <PolarAngleAxis dataKey="dimension" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 10 }} />
                {robots.map((r, i) => (
                  <Radar
                    key={r.id}
                    name={r.name}
                    dataKey={r.name}
                    stroke={robotColor(i)}
                    fill={robotColor(i)}
                    fillOpacity={0.15}
                  />
                ))}
                <Legend />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {barFields.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {barFields.map((field) => {
            const data = robots.map((r, i) => ({
              name: r.name,
              value: r[field.key] ?? 0,
              fill: robotColor(i),
            }));
            return (
              <Card key={field.key}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {field.label}
                    {field.unit ? ` (${field.unit})` : ""}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={data} margin={{ left: 0, right: 16, top: 8, bottom: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={60} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {data.map((entry, i) => (
                          <Cell key={i} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Non-numeric selected criteria (ROS2 support, sensors, etc.) can't be a
          bar chart, so they're shown in a table instead. */}
      {tableFields.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Other selected criteria</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="sticky left-0 bg-white">Criterion</TableHead>
                    {robots.map((r) => (
                      <TableHead key={r.id}>{r.name}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tableFields.map((field) => (
                    <TableRow key={field.key}>
                      <TableCell className="font-medium sticky left-0 bg-white">
                        {field.label}
                        {field.unit ? <span className="text-slate-400 text-xs ml-1">({field.unit})</span> : null}
                      </TableCell>
                      {robots.map((r) => (
                        <TableCell key={r.id} className="align-top text-sm">
                          {formatFieldValue(r, field)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {barFields.length === 0 && tableFields.length === 0 && (
        <p className="text-sm text-slate-500">Pick one or more criteria above to chart or tabulate.</p>
      )}

      {robots.some((r) => r.recommendation || r.summary) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {robots.map((r, i) => (
            <Card key={r.id} className="border-l-4" style={{ borderLeftColor: robotColor(i) }}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">{r.name}</CardTitle>
                  {r.recommendation && (
                    <Badge variant="outline" className={RECOMMENDATION_CLASSES[r.recommendation] ?? ""}>
                      {RECOMMENDATION_LABELS[r.recommendation] ?? r.recommendation}
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="text-sm text-slate-600 space-y-2">
                {r.summary && <p>{r.summary}</p>}
                {r.researchNote && <p className="text-xs italic text-slate-500">{r.researchNote}</p>}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
