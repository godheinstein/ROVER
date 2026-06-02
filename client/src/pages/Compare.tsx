import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Fragment, useState, useEffect, useMemo } from "react";
import { X, ExternalLink, SlidersHorizontal, Plus } from "lucide-react";
import { Link } from "wouter";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AppNav from "@/components/AppNav";
import ComparisonCharts from "@/components/ComparisonCharts";
import { ROBOT_FIELDS, FIELD_GROUPS, ROBOT_TYPE_LABELS, type RobotField } from "@/lib/robotFields";
import { loadSelection, saveSelection } from "@/lib/selection";
import {
  RECOMMENDATION_LABELS,
  RECOMMENDATION_CLASSES,
  ROS2_LABELS,
  ROS2_CLASSES,
} from "@/lib/robotDisplay";

function renderCell(robot: any, field: RobotField) {
  const value = robot[field.key];
  const empty = <span className="text-slate-400">—</span>;
  if (value === null || value === undefined || value === "") return empty;

  switch (field.format) {
    case "type":
      return <Badge variant="outline">{ROBOT_TYPE_LABELS[value] ?? value}</Badge>;
    case "boolean":
      return (
        <Badge variant={value ? "default" : "secondary"} className={value ? "bg-green-600" : ""}>
          {value ? "Yes" : "No"}
        </Badge>
      );
    case "ros2":
      return (
        <Badge variant="outline" className={ROS2_CLASSES[value] ?? ""}>
          {ROS2_LABELS[value] ?? value}
        </Badge>
      );
    case "recommendation":
      return (
        <Badge variant="outline" className={RECOMMENDATION_CLASSES[value] ?? ""}>
          {RECOMMENDATION_LABELS[value] ?? value}
        </Badge>
      );
    case "list":
      return Array.isArray(value) && value.length ? (
        <ul className="list-disc list-inside text-sm space-y-0.5">
          {value.map((v: string, i: number) => (
            <li key={i}>{v}</li>
          ))}
        </ul>
      ) : (
        empty
      );
    case "links":
      return Array.isArray(value) && value.length ? (
        <div className="flex flex-col gap-1">
          {value.map((l: any, i: number) => (
            <a
              key={i}
              href={l.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline inline-flex items-center gap-1 text-sm"
            >
              {l.label}
              <ExternalLink className="h-3 w-3" />
            </a>
          ))}
        </div>
      ) : (
        empty
      );
    case "link":
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline inline-flex items-center gap-1"
        >
          Website <ExternalLink className="h-3 w-3" />
        </a>
      );
    case "number":
      return (
        <span>
          {value}
          {field.unit ? <span className="text-slate-400 text-xs ml-1">{field.unit}</span> : null}
        </span>
      );
    default:
      return <span>{String(value)}</span>;
  }
}

export default function Compare() {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const robots = trpc.robots.list.useQuery();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ids = params.get("ids");
    if (ids) {
      const parsed = ids.split(",").map(Number).filter((n) => !Number.isNaN(n));
      setSelectedIds(parsed);
      saveSelection(parsed);
    } else {
      // Restore the selection carried from a previous visit / the Search tab.
      setSelectedIds(loadSelection());
    }
  }, []);

  // Persist the selection so it carries over to the Evaluation Matrix tab.
  const syncUrl = (ids: number[]) => {
    saveSelection(ids);
    const params = new URLSearchParams();
    if (ids.length > 0) {
      params.set("ids", ids.join(","));
      window.history.replaceState({}, "", `?${params.toString()}`);
    } else {
      window.history.replaceState({}, "", window.location.pathname);
    }
  };

  const compareRobots = useMemo(() => {
    if (!robots.data) return [];
    const byId = new Map(robots.data.map((r: any) => [r.id, r]));
    return selectedIds.map((id) => byId.get(id)).filter(Boolean);
  }, [selectedIds, robots.data]);

  const removeRobot = (id: number) => {
    const next = selectedIds.filter((i) => i !== id);
    setSelectedIds(next);
    syncUrl(next);
  };

  const addRobot = (id: number) => {
    if (selectedIds.includes(id)) return;
    const next = [...selectedIds, id];
    setSelectedIds(next);
    syncUrl(next);
  };

  const available = (robots.data || []).filter((r: any) => !selectedIds.includes(r.id));

  // Only show field rows that at least one compared robot populates.
  const visibleFieldsByGroup = useMemo(() => {
    return FIELD_GROUPS.map((group) => {
      const fields = ROBOT_FIELDS.filter(
        (f) =>
          f.group === group &&
          compareRobots.some(
            (r: any) =>
              r[f.key] !== null &&
              r[f.key] !== undefined &&
              r[f.key] !== "" &&
              !(Array.isArray(r[f.key]) && r[f.key].length === 0)
          )
      );
      return { group, fields };
    }).filter((g) => g.fields.length > 0);
  }, [compareRobots]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AppNav />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Robot Comparison</h2>
            <p className="text-slate-600">Compare specifications side-by-side across {compareRobots.length} robot(s)</p>
          </div>
          <div className="flex items-center gap-2">
            {available.length > 0 && (
              <Select onValueChange={(v) => addRobot(Number(v))} value="">
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="+ Add a robot" />
                </SelectTrigger>
                <SelectContent>
                  {available.map((r: any) => (
                    <SelectItem key={r.id} value={String(r.id)}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {compareRobots.length > 0 && (
              <Link href={`/matrix?ids=${selectedIds.join(",")}`}>
                <Button variant="outline">
                  <SlidersHorizontal className="h-4 w-4 mr-2" />
                  Open in Matrix
                </Button>
              </Link>
            )}
          </div>
        </div>

        {compareRobots.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12 text-slate-500">
              <p>No robots selected for comparison.</p>
              <Link href="/">
                <Button className="mt-4">
                  <Plus className="h-4 w-4 mr-2" />
                  Go to Search
                </Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Charts & Overview</TabsTrigger>
              <TabsTrigger value="specs">Full Specifications</TabsTrigger>
            </TabsList>

            <TabsContent value="overview">
              <ComparisonCharts robots={compareRobots} />
            </TabsContent>

            <TabsContent value="specs">
              <Card>
                <CardHeader>
                  <CardTitle>Specifications</CardTitle>
                  <CardDescription>Only fields with data for the selected robots are shown.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-52 sticky left-0 bg-white z-10">Specification</TableHead>
                          {compareRobots.map((robot: any) => (
                            <TableHead key={robot.id} className="min-w-[200px]">
                              <div className="flex items-center justify-between gap-2">
                                <span className="font-semibold">
                                  {robot.websiteUrl ? (
                                    <a
                                      href={robot.websiteUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline inline-flex items-center gap-1"
                                    >
                                      {robot.name}
                                      <ExternalLink className="h-3 w-3" />
                                    </a>
                                  ) : (
                                    robot.name
                                  )}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => removeRobot(robot.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableHead>
                          ))}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {visibleFieldsByGroup.map(({ group, fields }) => (
                          <Fragment key={group}>
                            <TableRow className="bg-slate-100/80">
                              <TableCell
                                colSpan={compareRobots.length + 1}
                                className="font-semibold text-slate-700 sticky left-0"
                              >
                                {group}
                              </TableCell>
                            </TableRow>
                            {fields.map((field) => (
                              <TableRow key={field.key}>
                                <TableCell className="font-medium sticky left-0 bg-white z-10">
                                  {field.label}
                                  {field.unit ? (
                                    <span className="text-slate-400 text-xs ml-1">({field.unit})</span>
                                  ) : null}
                                </TableCell>
                                {compareRobots.map((robot: any) => (
                                  <TableCell key={robot.id} className="align-top">
                                    {renderCell(robot, field)}
                                  </TableCell>
                                ))}
                              </TableRow>
                            ))}
                          </Fragment>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}
      </main>
    </div>
  );
}
