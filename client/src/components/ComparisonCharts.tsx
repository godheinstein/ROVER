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
import { robotColor, RECOMMENDATION_LABELS, RECOMMENDATION_CLASSES } from "@/lib/robotDisplay";
import { getField } from "@/lib/robotFields";

const SCORE_DIMENSIONS: { key: string; label: string }[] = [
  { key: "scoreRos2Support", label: "ROS2" },
  { key: "scoreSdkOpenness", label: "SDK" },
  { key: "scoreSimulationSupport", label: "Simulation" },
  { key: "scoreComputePower", label: "Compute" },
  { key: "scoreDeveloperCommunity", label: "Community" },
  { key: "scorePayloadCapability", label: "Payload" },
  { key: "scoreDexterity", label: "Dexterity" },
];

// Numeric specs we surface as bar charts when at least two robots have data.
const BAR_FIELDS = ["dofTotal", "payloadPerArm", "usablePayload", "batteryHours", "armDof", "reach"];

function hasAnyValue(robots: any[], key: string): boolean {
  return robots.some((r) => r[key] !== null && r[key] !== undefined && r[key] !== "");
}

export default function ComparisonCharts({ robots }: { robots: any[] }) {
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

  const barFields = BAR_FIELDS.filter((key) => hasAnyValue(robots, key));

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
          {barFields.map((key) => {
            const field = getField(key);
            const data = robots.map((r, i) => ({
              name: r.name,
              value: r[key] ?? 0,
              fill: robotColor(i),
            }));
            return (
              <Card key={key}>
                <CardHeader>
                  <CardTitle className="text-base">
                    {field?.label}
                    {field?.unit ? ` (${field.unit})` : ""}
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
