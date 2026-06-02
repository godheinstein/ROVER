import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Fragment, useState } from "react";
import { ArrowLeft, Plus, Edit, Trash2, Loader2, Upload } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import AppNav from "@/components/AppNav";
import { ROBOT_FIELDS, FIELD_GROUPS, ROBOT_TYPE_LABELS, type RobotField } from "@/lib/robotFields";

type FormValues = Record<string, string>;

const UNSET = "__unset__";
const ROS2_OPTIONS = ["native", "official-driver", "via-bridge", "not-confirmed", "none"];
const RECO_OPTIONS = ["top", "strong", "good", "moderate", "not-recommended"];
const LONG_TEXT = new Set([
  "summary",
  "researchNote",
  "remarks",
  "functions",
  "ros2Note",
  "payloadNote",
  "dofNote",
  "heightNote",
  "batteryNote",
  "eoatCompatibility",
  "certifications",
  "aiPlatform",
  "openSourceModel",
]);

const normalizeKey = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");

function buildEmptyForm(): FormValues {
  const form: FormValues = { name: "" };
  for (const f of ROBOT_FIELDS) {
    if (f.key === "type") form.type = "mobile_manipulator";
    else if (f.format === "boolean") form[f.key] = "0";
    else if (f.format === "ros2" || f.format === "recommendation") form[f.key] = UNSET;
    else form[f.key] = "";
  }
  return form;
}

function robotToForm(robot: any): FormValues {
  const form: FormValues = { name: robot.name ?? "" };
  for (const f of ROBOT_FIELDS) {
    const v = robot[f.key];
    if (f.key === "type") form.type = v ?? "mobile_manipulator";
    else if (f.format === "boolean") form[f.key] = v ? "1" : "0";
    else if (f.format === "list") form[f.key] = Array.isArray(v) ? v.join(", ") : "";
    else if (f.format === "links") form[f.key] = Array.isArray(v) && v.length ? JSON.stringify(v) : "";
    else if (f.format === "ros2" || f.format === "recommendation") form[f.key] = v || UNSET;
    else form[f.key] = v === null || v === undefined ? "" : String(v);
  }
  return form;
}

// Convert a string form value to the typed payload value for a field.
function coerce(field: RobotField, raw: string): any {
  if (field.format === "boolean") return Number(raw) ? 1 : 0;
  const trimmed = (raw ?? "").trim();
  if (trimmed === "" || trimmed === UNSET) return undefined;
  switch (field.format) {
    case "number": {
      const n = Number(trimmed);
      return Number.isFinite(n) ? n : undefined;
    }
    case "list":
      return trimmed
        .split(/[,;]/)
        .map((s) => s.trim())
        .filter(Boolean);
    case "links":
      try {
        const parsed = JSON.parse(trimmed);
        return Array.isArray(parsed) ? parsed : undefined;
      } catch {
        return undefined;
      }
    default:
      return trimmed;
  }
}

function formToPayload(form: FormValues): any {
  const payload: any = { name: form.name.trim(), type: form.type };
  for (const f of ROBOT_FIELDS) {
    if (f.key === "type") continue;
    const v = coerce(f, form[f.key] ?? "");
    if (v !== undefined) payload[f.key] = v;
  }
  return payload;
}

export default function AdminDashboard() {
  const { user, loading: authLoading, isAuthenticated } = useAuth();
  const isAdmin = user?.role === "admin";

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [editingRobot, setEditingRobot] = useState<any>(null);
  const [formData, setFormData] = useState<FormValues>(buildEmptyForm);

  const utils = trpc.useUtils();
  const robots = trpc.robots.list.useQuery();

  const createMutation = trpc.robots.create.useMutation({
    onSuccess: () => {
      utils.robots.list.invalidate();
      toast.success("Robot created successfully");
      setIsDialogOpen(false);
      setFormData(buildEmptyForm());
    },
    onError: (error) => toast.error("Failed to create robot: " + error.message),
  });

  const updateMutation = trpc.robots.update.useMutation({
    onSuccess: () => {
      utils.robots.list.invalidate();
      toast.success("Robot updated successfully");
      setIsDialogOpen(false);
      setEditingRobot(null);
      setFormData(buildEmptyForm());
    },
    onError: (error) => toast.error("Failed to update robot: " + error.message),
  });

  const deleteMutation = trpc.robots.delete.useMutation({
    onSuccess: () => {
      utils.robots.list.invalidate();
      toast.success("Robot deleted successfully");
    },
    onError: (error) => toast.error("Failed to delete robot: " + error.message),
  });

  const bulkUploadMutation = trpc.robots.bulkUpload.useMutation({
    onSuccess: (result) => {
      utils.robots.list.invalidate();
      toast.success(`Successfully uploaded ${result.success} robot(s)`);
      if (result.failed > 0) toast.error(`Failed to upload ${result.failed} robot(s)`);
      setIsBulkUploadOpen(false);
    },
    onError: (error) => toast.error("Bulk upload failed: " + error.message),
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const XLSX = (await import("xlsx")).default;
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: "array" });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName!];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          const parsed = jsonData
            .map((row: any) => {
              const norm: Record<string, any> = {};
              for (const k of Object.keys(row)) norm[normalizeKey(k)] = row[k];
              const get = (key: string) => norm[normalizeKey(key)];

              const out: any = {
                name: get("name"),
                type: get("type") || "mobile_base",
              };
              for (const f of ROBOT_FIELDS) {
                if (f.key === "type") continue;
                const raw = get(f.key);
                if (raw === undefined || raw === null || raw === "") continue;
                if (f.format === "boolean") {
                  out[f.key] = ["1", "true", "yes", "y"].includes(String(raw).toLowerCase()) || raw === 1 ? 1 : 0;
                } else if (f.format === "number") {
                  const n = Number(raw);
                  if (Number.isFinite(n)) out[f.key] = n;
                } else if (f.format === "list") {
                  out[f.key] = Array.isArray(raw)
                    ? raw
                    : String(raw).split(/[,;]/).map((s) => s.trim()).filter(Boolean);
                } else {
                  out[f.key] = String(raw);
                }
              }
              return out;
            })
            .filter((r: any) => r.name);

          if (parsed.length === 0) {
            toast.error("No rows with a 'name' column were found");
            return;
          }
          bulkUploadMutation.mutate({ robots: parsed });
        } catch (error) {
          toast.error("Failed to parse file: " + (error instanceof Error ? error.message : "Unknown error"));
        }
      };
      reader.readAsArrayBuffer(file);
    } catch {
      toast.error("Failed to read file");
    }
    event.target.value = "";
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  // Gate: must be logged in AND have the admin role.
  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-slate-50">
        <AppNav />
        <div className="flex items-center justify-center py-24">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>{isAuthenticated ? "Admin Access Required" : "Authentication Required"}</CardTitle>
              <CardDescription>
                {isAuthenticated
                  ? "Your account does not have admin rights. Ask an administrator to grant access."
                  : "You need to be logged in as an administrator to manage the database."}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {!isAuthenticated && (
                <a href={getLoginUrl()}>
                  <Button className="w-full">Login</Button>
                </a>
              )}
              <Link href="/">
                <Button variant="outline" className="w-full">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Search
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const handleOpenDialog = (robot?: any) => {
    if (robot) {
      setEditingRobot(robot);
      setFormData(robotToForm(robot));
    } else {
      setEditingRobot(null);
      setFormData(buildEmptyForm());
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast.error("Robot name is required");
      return;
    }
    const payload = formToPayload(formData);
    if (editingRobot) updateMutation.mutate({ id: editingRobot.id, ...payload });
    else createMutation.mutate(payload);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this robot?")) deleteMutation.mutate({ id });
  };

  const set = (key: string, value: string) => setFormData((prev) => ({ ...prev, [key]: value }));

  const renderInput = (field: RobotField) => {
    const value = formData[field.key] ?? "";
    switch (field.format) {
      case "type":
        return (
          <Select value={value} onValueChange={(v) => set("type", v)}>
            <SelectTrigger id={field.key}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(ROBOT_TYPE_LABELS).map(([val, label]) => (
                <SelectItem key={val} value={val}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "boolean":
        return (
          <Select value={value} onValueChange={(v) => set(field.key, v)}>
            <SelectTrigger id={field.key}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">No</SelectItem>
              <SelectItem value="1">Yes</SelectItem>
            </SelectContent>
          </Select>
        );
      case "ros2":
      case "recommendation": {
        const opts = field.format === "ros2" ? ROS2_OPTIONS : RECO_OPTIONS;
        return (
          <Select value={value || UNSET} onValueChange={(v) => set(field.key, v)}>
            <SelectTrigger id={field.key}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={UNSET}>Unspecified</SelectItem>
              {opts.map((o) => (
                <SelectItem key={o} value={o}>
                  {o}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      }
      case "links":
        return (
          <Textarea
            id={field.key}
            placeholder='[{"label":"Docs","url":"https://…","type":"docs"}]'
            value={value}
            onChange={(e) => set(field.key, e.target.value)}
            rows={2}
          />
        );
      case "list":
        return (
          <Input
            id={field.key}
            placeholder="comma-separated"
            value={value}
            onChange={(e) => set(field.key, e.target.value)}
          />
        );
      case "number":
        return (
          <Input id={field.key} type="number" value={value} onChange={(e) => set(field.key, e.target.value)} />
        );
      default:
        return LONG_TEXT.has(field.key) ? (
          <Textarea id={field.key} value={value} onChange={(e) => set(field.key, e.target.value)} rows={2} />
        ) : (
          <Input id={field.key} value={value} onChange={(e) => set(field.key, e.target.value)} />
        );
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <AppNav />

      <main className="container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <CardTitle>Manage Robots</CardTitle>
                <CardDescription>Add, edit, or remove robots. Signed in as {user?.email} (admin).</CardDescription>
              </div>
              <div className="flex gap-2">
                <Dialog open={isBulkUploadOpen} onOpenChange={setIsBulkUploadOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline">
                      <Upload className="h-4 w-4 mr-2" />
                      Bulk Upload
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Bulk Upload Robots</DialogTitle>
                      <DialogDescription>
                        Upload a CSV or Excel file. Column headers are matched (case-insensitively) to field names like
                        <code> name</code>, <code>type</code>, <code>manufacturer</code>, <code>dofTotal</code>,
                        <code> payloadPerArm</code>, etc.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="file-upload">Select File</Label>
                        <Input
                          id="file-upload"
                          type="file"
                          accept=".csv,.xlsx,.xls"
                          onChange={handleFileUpload}
                          disabled={bulkUploadMutation.isPending}
                        />
                      </div>
                      <p className="text-xs text-slate-500">
                        <code>name</code> is required; <code>type</code> defaults to <code>mobile_base</code>. List
                        fields (sensors, connectivity, sdkLanguages…) accept comma-separated values.
                      </p>
                      {bulkUploadMutation.isPending && (
                        <div className="flex items-center gap-2 text-sm">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading robots…
                        </div>
                      )}
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button onClick={() => handleOpenDialog()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Robot
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                      <DialogTitle>{editingRobot ? "Edit Robot" : "Add New Robot"}</DialogTitle>
                      <DialogDescription>Fill in the specifications. Only Name and Type are required.</DialogDescription>
                    </DialogHeader>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                      <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="name">Name *</Label>
                        <Input id="name" value={formData.name} onChange={(e) => set("name", e.target.value)} />
                      </div>

                      {FIELD_GROUPS.map((group) => {
                        const fields = ROBOT_FIELDS.filter((f) => f.group === group);
                        if (fields.length === 0) return null;
                        return (
                          <Fragment key={group}>
                            <div className="md:col-span-2 mt-2">
                              <h3 className="font-semibold text-sm text-slate-700 border-b pb-1">{group}</h3>
                            </div>
                            {fields.map((field) => {
                              const wide = LONG_TEXT.has(field.key) || field.format === "links";
                              return (
                                <div key={field.key} className={`space-y-2 ${wide ? "md:col-span-2" : ""}`}>
                                  <Label htmlFor={field.key}>
                                    {field.label}
                                    {field.unit ? ` (${field.unit})` : ""}
                                    {field.key === "type" ? " *" : ""}
                                  </Label>
                                  {renderInput(field)}
                                </div>
                              );
                            })}
                          </Fragment>
                        );
                      })}
                    </div>

                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleSubmit} disabled={createMutation.isPending || updateMutation.isPending}>
                        {(createMutation.isPending || updateMutation.isPending) && (
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        )}
                        {editingRobot ? "Update" : "Create"}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {robots.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : robots.data && robots.data.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>No robots yet. Click "Add Robot" to get started!</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Payload (kg)</TableHead>
                      <TableHead>DOF</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {robots.data?.map((robot: any) => (
                      <TableRow key={robot.id}>
                        <TableCell className="font-medium">{robot.name}</TableCell>
                        <TableCell>{ROBOT_TYPE_LABELS[robot.type] ?? robot.type}</TableCell>
                        <TableCell>{robot.manufacturer || "—"}</TableCell>
                        <TableCell>{robot.usablePayload ?? robot.payloadPerArm ?? "—"}</TableCell>
                        <TableCell>{robot.dofTotal ?? robot.armDof ?? "—"}</TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(robot)}>
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(robot.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
