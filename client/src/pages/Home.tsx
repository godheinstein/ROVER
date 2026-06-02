import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Search, Filter, Loader2, SlidersHorizontal, ExternalLink } from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import AppNav from "@/components/AppNav";
import { ROBOT_TYPE_LABELS } from "@/lib/robotFields";

const EMPTY_FILTERS = {
  type: "",
  manufacturer: "",
  country: "",
  keyword: "",
  minPayload: "",
  maxPayload: "",
  minReach: "",
  maxReach: "",
  ros2Support: "",
  driveSystem: "",
  minArmDof: "",
  minDofTotal: "",
  minYear: "",
  rosCompatible: false,
  forceSensor: false,
  llmIntegration: false,
  openSource: false,
};

// Boolean "require this capability" checkbox criteria.
const BOOLEAN_CRITERIA: { key: keyof typeof EMPTY_FILTERS; label: string }[] = [
  { key: "rosCompatible", label: "ROS compatible" },
  { key: "forceSensor", label: "Force/torque sensor" },
  { key: "llmIntegration", label: "Onboard LLM / VLA" },
  { key: "openSource", label: "Open-source SDK" },
];

export default function Home() {
  const { isAuthenticated } = useAuth();

  const [nlQuery, setNlQuery] = useState("");
  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [activeTab, setActiveTab] = useState<"nl" | "filter">("nl");
  const [searchResults, setSearchResults] = useState<any[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedForComparison, setSelectedForComparison] = useState<number[]>([]);

  const allRobots = trpc.robots.list.useQuery();
  const nlSearchMutation = trpc.robots.naturalLanguageQuery.useMutation();

  const num = (v: string) => (v.trim() !== "" ? Number(v) : undefined);
  const str = (v: string, sentinel?: string) =>
    v && v !== sentinel ? v : undefined;

  const filterSearchQuery = trpc.robots.search.useQuery(
    {
      type: str(filters.type, "all"),
      manufacturer: filters.manufacturer || undefined,
      country: filters.country || undefined,
      keyword: filters.keyword || undefined,
      minPayload: num(filters.minPayload),
      maxPayload: num(filters.maxPayload),
      minReach: num(filters.minReach),
      maxReach: num(filters.maxReach),
      ros2Support: str(filters.ros2Support, "any"),
      driveSystem: filters.driveSystem || undefined,
      minArmDof: num(filters.minArmDof),
      minDofTotal: num(filters.minDofTotal),
      minYear: num(filters.minYear),
      rosCompatible: filters.rosCompatible ? true : undefined,
      forceSensor: filters.forceSensor ? true : undefined,
      llmIntegration: filters.llmIntegration ? true : undefined,
      openSource: filters.openSource ? true : undefined,
    },
    { enabled: false }
  );

  const handleNaturalLanguageSearch = async () => {
    if (!nlQuery.trim()) {
      toast.error("Please enter a search query");
      return;
    }
    setIsSearching(true);
    try {
      const result = await nlSearchMutation.mutateAsync({ query: nlQuery });
      setSearchResults(result.results);
      toast.success(result.explanation);
    } catch (error) {
      toast.error("Failed to process search query (is OPENAI_API_KEY set?)");
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterSearch = async () => {
    setIsSearching(true);
    try {
      const result = await filterSearchQuery.refetch();
      if (result.data) {
        setSearchResults(result.data);
        toast.success(`Found ${result.data.length} robot(s)`);
      }
    } catch (error) {
      toast.error("Failed to search robots");
      console.error(error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearFilters = () => {
    setFilters({ ...EMPTY_FILTERS });
    setSearchResults(null);
  };

  const displayRobots = searchResults ?? allRobots.data ?? [];

  const payloadOf = (r: any) => r.usablePayload ?? r.payloadPerArm ?? null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <AppNav />

      <main className="container mx-auto px-4 py-8">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Search Robots</CardTitle>
            <CardDescription>
              Find mobile manipulators, mobile bases, arms, and humanoids by natural language or precise criteria.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 mb-6">
              <Button variant={activeTab === "nl" ? "default" : "outline"} onClick={() => setActiveTab("nl")}>
                <Search className="h-4 w-4 mr-2" />
                Natural Language
              </Button>
              <Button variant={activeTab === "filter" ? "default" : "outline"} onClick={() => setActiveTab("filter")}>
                <Filter className="h-4 w-4 mr-2" />
                Criteria & Filters
              </Button>
            </div>

            {activeTab === "nl" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="e.g., humanoid from the USA with native ROS2 and onboard LLM"
                    value={nlQuery}
                    onChange={(e) => setNlQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleNaturalLanguageSearch()}
                    className="flex-1"
                  />
                  <Button onClick={handleNaturalLanguageSearch} disabled={isSearching}>
                    {isSearching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                  </Button>
                </div>
                <p className="text-sm text-slate-600">
                  Try: "mobile manipulator with at least 10kg payload and force sensor" or "open-source humanoid with
                  Isaac Sim support".
                </p>
              </div>
            )}

            {activeTab === "filter" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Keyword</Label>
                    <Input
                      placeholder="name, function, summary…"
                      value={filters.keyword}
                      onChange={(e) => setFilters({ ...filters, keyword: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Robot Type</Label>
                    <Select value={filters.type} onValueChange={(v) => setFilters({ ...filters, type: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        {Object.entries(ROBOT_TYPE_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Manufacturer</Label>
                    <Input
                      placeholder="e.g., Universal Robots"
                      value={filters.manufacturer}
                      onChange={(e) => setFilters({ ...filters, manufacturer: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input
                      placeholder="e.g., USA"
                      value={filters.country}
                      onChange={(e) => setFilters({ ...filters, country: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Payload (kg)</Label>
                    <Input
                      type="number"
                      value={filters.minPayload}
                      onChange={(e) => setFilters({ ...filters, minPayload: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Payload (kg)</Label>
                    <Input
                      type="number"
                      value={filters.maxPayload}
                      onChange={(e) => setFilters({ ...filters, maxPayload: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Reach (mm)</Label>
                    <Input
                      type="number"
                      value={filters.minReach}
                      onChange={(e) => setFilters({ ...filters, minReach: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Reach (mm)</Label>
                    <Input
                      type="number"
                      value={filters.maxReach}
                      onChange={(e) => setFilters({ ...filters, maxReach: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ROS2 Support</Label>
                    <Select value={filters.ros2Support} onValueChange={(v) => setFilters({ ...filters, ros2Support: v })}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="any">Any</SelectItem>
                        <SelectItem value="native">Native</SelectItem>
                        <SelectItem value="official-driver">Official Driver</SelectItem>
                        <SelectItem value="via-bridge">Via Bridge</SelectItem>
                        <SelectItem value="not-confirmed">Not Confirmed</SelectItem>
                        <SelectItem value="none">None</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Drive System</Label>
                    <Input
                      placeholder="e.g., differential"
                      value={filters.driveSystem}
                      onChange={(e) => setFilters({ ...filters, driveSystem: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Arm DOF</Label>
                    <Input
                      type="number"
                      value={filters.minArmDof}
                      onChange={(e) => setFilters({ ...filters, minArmDof: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Min Total DOF</Label>
                    <Input
                      type="number"
                      value={filters.minDofTotal}
                      onChange={(e) => setFilters({ ...filters, minDofTotal: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Released After (year)</Label>
                    <Input
                      type="number"
                      value={filters.minYear}
                      onChange={(e) => setFilters({ ...filters, minYear: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <Label className="mb-2 block">Required capabilities</Label>
                  <div className="flex flex-wrap gap-4">
                    {BOOLEAN_CRITERIA.map((c) => (
                      <label key={c.key} className="flex items-center gap-2 text-sm cursor-pointer">
                        <Checkbox
                          checked={filters[c.key] as boolean}
                          onCheckedChange={(checked) => setFilters({ ...filters, [c.key]: checked === true })}
                        />
                        {c.label}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleFilterSearch} disabled={isSearching}>
                    {isSearching ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Search
                  </Button>
                  <Button variant="outline" onClick={handleClearFilters}>
                    Clear Filters
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between flex-wrap gap-2">
              <CardTitle>
                {searchResults !== null ? "Search Results" : "All Robots"}
                <Badge variant="secondary" className="ml-2">
                  {displayRobots.length}
                </Badge>
              </CardTitle>
              {selectedForComparison.length > 0 && (
                <div className="flex gap-2">
                  <Link href={`/compare?ids=${selectedForComparison.join(",")}`}>
                    <Button>Compare ({selectedForComparison.length})</Button>
                  </Link>
                  <Link href={`/matrix?ids=${selectedForComparison.join(",")}`}>
                    <Button variant="outline">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      Evaluate
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {allRobots.isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
              </div>
            ) : displayRobots.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                <p>No robots found. {isAuthenticated && "Add some from the admin panel!"}</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">
                        <Checkbox
                          checked={
                            selectedForComparison.length === displayRobots.length && displayRobots.length > 0
                          }
                          onCheckedChange={(checked) =>
                            setSelectedForComparison(checked === true ? displayRobots.map((r: any) => r.id) : [])
                          }
                        />
                      </TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Manufacturer</TableHead>
                      <TableHead>Payload (kg)</TableHead>
                      <TableHead>DOF</TableHead>
                      <TableHead>ROS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayRobots.map((robot: any) => (
                      <TableRow key={robot.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedForComparison.includes(robot.id)}
                            onCheckedChange={(checked) =>
                              setSelectedForComparison((prev) =>
                                checked === true ? [...prev, robot.id] : prev.filter((id) => id !== robot.id)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {robot.websiteUrl ? (
                            <a
                              href={robot.websiteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline inline-flex items-center gap-1"
                            >
                              {robot.name}
                              <ExternalLink className="h-3.5 w-3.5" />
                            </a>
                          ) : (
                            <span>{robot.name}</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{ROBOT_TYPE_LABELS[robot.type] ?? robot.type}</Badge>
                        </TableCell>
                        <TableCell>{robot.manufacturer || "—"}</TableCell>
                        <TableCell>{payloadOf(robot) ?? "—"}</TableCell>
                        <TableCell>{robot.dofTotal ?? robot.armDof ?? "—"}</TableCell>
                        <TableCell>
                          {robot.rosCompatible ? (
                            <Badge className="bg-green-600">Yes</Badge>
                          ) : (
                            <Badge variant="secondary">No</Badge>
                          )}
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
