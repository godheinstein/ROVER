import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useState, useEffect, useMemo } from "react";
import { ArrowDown, ArrowUp, Plus, RotateCcw, Trash2, X } from "lucide-react";
import AppNav from "@/components/AppNav";
import {
  computeMatrix,
  defaultCriteria,
  specCriteria,
  newCriterionId,
  firstUnusedField,
  type MatrixCriterion,
} from "@/lib/matrix";
import { NUMERIC_FIELDS, FIELD_GROUPS, getField } from "@/lib/robotFields";
import { robotColor } from "@/lib/robotDisplay";
import { loadSelection } from "@/lib/selection";

function scoreColor(score: number): string {
  if (score >= 75) return "bg-green-500";
  if (score >= 50) return "bg-blue-500";
  if (score >= 25) return "bg-amber-500";
  return "bg-red-500";
}

function fieldLabel(key: string): string {
  const f = getField(key);
  return f ? `${f.label}${f.unit ? ` (${f.unit})` : ""}` : key;
}

export default function Matrix() {
  const robots = trpc.robots.list.useQuery();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [criteria, setCriteria] = useState<MatrixCriterion[]>(() => defaultCriteria());
  const [expanded, setExpanded] = useState<number | null>(null);

  // Seed selection from ?ids=, then the selection carried over from the Compare
  // tab, then fall back to all robots.
  useEffect(() => {
    if (initialized || !robots.data) return;
    const validIds = new Set(robots.data.map((r: any) => r.id));
    const params = new URLSearchParams(window.location.search);
    const ids = params.get("ids");
    if (ids) {
      setSelectedIds(ids.split(",").map(Number).filter((n) => validIds.has(n)));
    } else {
      const carried = loadSelection().filter((n) => validIds.has(n));
      setSelectedIds(carried.length > 0 ? carried : robots.data.map((r: any) => r.id));
    }
    setInitialized(true);
  }, [robots.data, initialized]);

  const selectedRobots = useMemo(() => {
    if (!robots.data) return [];
    const byId = new Map(robots.data.map((r: any) => [r.id, r]));
    return selectedIds.map((id) => byId.get(id)).filter(Boolean);
  }, [selectedIds, robots.data]);

  const available = (robots.data || []).filter((r: any) => !selectedIds.includes(r.id));

  const results = useMemo(
    () => computeMatrix(selectedRobots, criteria),
    [selectedRobots, criteria]
  );

  // Weights are treated as percentages that should add up to 100. The matrix
  // engine still divides by the running total, so partial sums stay sensible.
  const totalWeight = criteria.reduce((s, c) => s + (c.weight || 0), 0);
  const remaining = Math.round((100 - totalWeight) * 10) / 10;
  const isBalanced = criteria.length > 0 && remaining === 0;

  // Scale all weights so they sum to exactly 100 (whole numbers, remainder
  // absorbed by the largest criterion).
  const normalizeTo100 = () => {
    if (totalWeight <= 0) return;
    const scaled = criteria.map((c) => ({ ...c, weight: Math.round((c.weight / totalWeight) * 100) }));
    const sum = scaled.reduce((s, c) => s + c.weight, 0);
    const diff = 100 - sum;
    if (diff !== 0 && scaled.length > 0) {
      let maxIdx = 0;
      for (let i = 1; i < scaled.length; i++) if (scaled[i].weight > scaled[maxIdx].weight) maxIdx = i;
      scaled[maxIdx] = { ...scaled[maxIdx], weight: Math.max(0, scaled[maxIdx].weight + diff) };
    }
    setCriteria(scaled);
  };

  // ----- criteria mutations -----
  const updateCriterion = (id: string, patch: Partial<MatrixCriterion>) =>
    setCriteria((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const removeCriterion = (id: string) =>
    setCriteria((prev) => prev.filter((c) => c.id !== id));

  const addCriterion = () => {
    const fieldKey = firstUnusedField(criteria);
    const field = getField(fieldKey);
    setCriteria((prev) => [
      ...prev,
      { id: newCriterionId(), fieldKey, weight: 10, higherIsBetter: field?.higherIsBetter ?? true },
    ]);
  };

  const changeField = (id: string, fieldKey: string) => {
    const field = getField(fieldKey);
    updateCriterion(id, { fieldKey, higherIsBetter: field?.higherIsBetter ?? true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AppNav />

      <main className="container mx-auto px-4 py-8 space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Evaluation Matrix</h2>
          <p className="text-slate-600">
            Score robots on the criteria that matter to you. Each criterion is normalized 0–100
            across the selected robots; tune the weights to see rankings update live.
          </p>
        </div>

        {/* Robot selection */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Robots in this matrix</CardTitle>
            <CardDescription>{selectedRobots.length} selected</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-2">
              {selectedRobots.map((r: any, i: number) => (
                <Badge
                  key={r.id}
                  variant="outline"
                  className="pl-2 pr-1 py-1 flex items-center gap-1"
                  style={{ borderColor: robotColor(i) }}
                >
                  {r.name}
                  <button
                    onClick={() => setSelectedIds((prev) => prev.filter((id) => id !== r.id))}
                    className="hover:bg-slate-200 rounded p-0.5"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
              {selectedRobots.length === 0 && (
                <span className="text-sm text-slate-500">Add robots to begin.</span>
              )}
            </div>
            {available.length > 0 && (
              <Select onValueChange={(v) => setSelectedIds((prev) => [...prev, Number(v)])} value="">
                <SelectTrigger className="w-[260px]">
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
          </CardContent>
        </Card>

        {/* Criteria editor */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div>
                <CardTitle className="text-lg">Criteria & Weights</CardTitle>
                <CardDescription>Weights should add up to 100%.</CardDescription>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setCriteria(defaultCriteria())}>
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Research preset
                </Button>
                <Button variant="outline" size="sm" onClick={() => setCriteria(specCriteria())}>
                  Hardware preset
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600" onClick={() => setCriteria([])}>
                  <Trash2 className="h-4 w-4 mr-2" />
                  Clear all
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Weight total / balance indicator */}
            {criteria.length > 0 && (
              <div className="flex items-center justify-between gap-3 flex-wrap rounded-md border bg-slate-50 px-4 py-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-slate-600">Total weight</span>
                  <span
                    className={`text-lg font-bold ${
                      isBalanced ? "text-green-600" : totalWeight > 100 ? "text-red-600" : "text-amber-600"
                    }`}
                  >
                    {totalWeight}%
                  </span>
                  {isBalanced ? (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-green-300">
                      Balanced ✓
                    </Badge>
                  ) : totalWeight > 100 ? (
                    <Badge variant="outline" className="bg-red-100 text-red-700 border-red-300">
                      {remaining}% (over by {Math.abs(remaining)}%)
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-300">
                      +{remaining}% needed
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={normalizeTo100} disabled={isBalanced || totalWeight <= 0}>
                  Normalize to 100%
                </Button>
              </div>
            )}

            {criteria.length === 0 && (
              <p className="text-sm text-slate-500">No criteria — add one below or pick a preset.</p>
            )}
            {criteria.map((c) => (
              <div key={c.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto_auto] gap-3 items-center border-b pb-3">
                <Select value={c.fieldKey} onValueChange={(v) => changeField(c.id, v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FIELD_GROUPS.map((group) => {
                      const groupFields = NUMERIC_FIELDS.filter((f) => f.group === group);
                      if (groupFields.length === 0) return null;
                      return (
                        <SelectGroup key={group}>
                          <SelectLabel>{group}</SelectLabel>
                          {groupFields.map((f) => (
                            <SelectItem key={f.key} value={f.key}>
                              {f.label}
                              {f.unit ? ` (${f.unit})` : ""}
                            </SelectItem>
                          ))}
                        </SelectGroup>
                      );
                    })}
                  </SelectContent>
                </Select>

                <div className="flex items-center gap-2 w-56">
                  <Slider
                    value={[c.weight]}
                    min={0}
                    max={100}
                    step={1}
                    onValueChange={([v]) => updateCriterion(c.id, { weight: v })}
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={c.weight}
                    onChange={(e) => updateCriterion(c.id, { weight: Number(e.target.value) || 0 })}
                    className="w-16 h-8"
                  />
                  <span className="text-xs text-slate-400 w-4">%</span>
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => updateCriterion(c.id, { higherIsBetter: !c.higherIsBetter })}
                  title="Toggle scoring direction"
                >
                  {c.higherIsBetter ? (
                    <>
                      <ArrowUp className="h-4 w-4 mr-1" /> Higher is better
                    </>
                  ) : (
                    <>
                      <ArrowDown className="h-4 w-4 mr-1" /> Lower is better
                    </>
                  )}
                </Button>

                <Button variant="ghost" size="sm" onClick={() => removeCriterion(c.id)} className="text-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button variant="outline" size="sm" onClick={addCriterion}>
              <Plus className="h-4 w-4 mr-2" />
              Add criterion
            </Button>
          </CardContent>
        </Card>

        {/* Ranking */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Weighted Ranking</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {results.length === 0 && <p className="text-sm text-slate-500">Select robots to rank.</p>}
            {results.map((res, index) => (
              <div
                key={res.robot.id}
                className="border rounded-lg p-4 hover:border-blue-400 cursor-pointer transition"
                onClick={() => setExpanded(expanded === res.robot.id ? null : res.robot.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className="text-lg font-bold text-slate-400 w-6">{index + 1}.</span>
                    <div>
                      <h4 className="font-bold text-slate-900">{res.robot.name}</h4>
                      <p className="text-xs text-slate-500">{res.robot.manufacturer}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-slate-900">{res.weightedScore}</div>
                    <p className="text-xs text-slate-400">/ 100</p>
                  </div>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full ${scoreColor(res.weightedScore)} transition-all`}
                    style={{ width: `${res.weightedScore}%` }}
                  />
                </div>

                {expanded === res.robot.id && (
                  <div className="mt-4 pt-4 border-t space-y-2">
                    {res.perCriterion.map((sc) => {
                      const crit = criteria.find((c) => c.id === sc.criterionId);
                      return (
                        <div key={sc.criterionId} className="space-y-1">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-medium text-slate-700">{fieldLabel(sc.fieldKey)}</span>
                            <span className="text-slate-500">
                              {sc.hasValue ? `raw ${sc.rawValue}` : "no data"} · {sc.normalized}/100 ·{" "}
                              {crit ? crit.weight : 0}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full ${scoreColor(sc.normalized)}`}
                              style={{ width: `${sc.normalized}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Detailed matrix table */}
        {results.length > 0 && criteria.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Matrix (normalized scores)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="sticky left-0 bg-white">Criterion</TableHead>
                      <TableHead>Weight</TableHead>
                      {results.map((res) => (
                        <TableHead key={res.robot.id} className="text-center">
                          {res.robot.name}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {criteria.map((c) => (
                      <TableRow key={c.id}>
                        <TableCell className="font-medium sticky left-0 bg-white">
                          {fieldLabel(c.fieldKey)}
                          <span className="text-xs text-slate-400 ml-1">
                            ({c.higherIsBetter ? "↑" : "↓"})
                          </span>
                        </TableCell>
                        <TableCell className="text-blue-600 font-semibold">{c.weight}%</TableCell>
                        {results.map((res) => {
                          const sc = res.perCriterion.find((s) => s.criterionId === c.id);
                          return (
                            <TableCell key={res.robot.id} className="text-center">
                              {sc?.hasValue ? sc.normalized : <span className="text-slate-300">—</span>}
                            </TableCell>
                          );
                        })}
                      </TableRow>
                    ))}
                    <TableRow className="bg-slate-100 font-bold">
                      <TableCell colSpan={2} className="sticky left-0 bg-slate-100">
                        Weighted Total
                      </TableCell>
                      {results.map((res) => (
                        <TableCell key={res.robot.id} className="text-center text-lg">
                          {res.weightedScore}
                        </TableCell>
                      ))}
                    </TableRow>
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
