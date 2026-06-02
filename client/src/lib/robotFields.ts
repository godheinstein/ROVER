// Central catalog of robot spec fields. This single source of truth drives the
// comparison table, the evaluation-matrix criteria picker, and value formatting
// across the app. Adding a column here makes it appear everywhere.

export type FieldFormat =
  | "text"
  | "number"
  | "boolean"
  | "type"
  | "ros2"
  | "list"
  | "links"
  | "recommendation"
  | "link";

export interface RobotField {
  key: string;
  label: string;
  unit?: string;
  group: string;
  format: FieldFormat;
  /** True when the field is a numeric spec usable as an evaluation-matrix criterion. */
  numeric?: boolean;
  /** Default scoring direction for the matrix (true = bigger value is better). */
  higherIsBetter?: boolean;
  /** For curated 1-5 scores, the maximum value. */
  scoreMax?: number;
}

export const ROBOT_FIELDS: RobotField[] = [
  // ----- Overview -----
  { key: "manufacturer", label: "Manufacturer", group: "Overview", format: "text" },
  { key: "type", label: "Type", group: "Overview", format: "type" },
  { key: "country", label: "Country", group: "Overview", format: "text" },
  { key: "year", label: "Year", group: "Overview", format: "number", numeric: true, higherIsBetter: true },
  { key: "recommendation", label: "Recommendation", group: "Overview", format: "recommendation" },
  { key: "summary", label: "Summary", group: "Overview", format: "text" },

  // ----- Physical -----
  { key: "heightCm", label: "Height", unit: "cm", group: "Physical", format: "number", numeric: true, higherIsBetter: false },
  { key: "height", label: "Height", unit: "mm", group: "Physical", format: "number", numeric: true, higherIsBetter: false },
  { key: "length", label: "Length", unit: "mm", group: "Physical", format: "number", numeric: true, higherIsBetter: false },
  { key: "width", label: "Width", unit: "mm", group: "Physical", format: "number", numeric: true, higherIsBetter: false },
  { key: "weight", label: "Weight", unit: "kg", group: "Physical", format: "number", numeric: true, higherIsBetter: false },
  { key: "locomotion", label: "Locomotion", group: "Physical", format: "text" },
  { key: "ipRating", label: "IP Rating", group: "Physical", format: "text" },
  { key: "priceUsd", label: "Price (USD)", group: "Physical", format: "text" },

  // ----- Degrees of Freedom -----
  { key: "dofTotal", label: "Total DOF", group: "Degrees of Freedom", format: "number", numeric: true, higherIsBetter: true },
  { key: "dofHead", label: "Head DOF", group: "Degrees of Freedom", format: "number", numeric: true, higherIsBetter: true },
  { key: "dofTorso", label: "Torso DOF", group: "Degrees of Freedom", format: "number", numeric: true, higherIsBetter: true },
  { key: "dofArmEach", label: "Arm DOF (each)", group: "Degrees of Freedom", format: "number", numeric: true, higherIsBetter: true },
  { key: "dofHandEach", label: "Hand DOF (each)", group: "Degrees of Freedom", format: "number", numeric: true, higherIsBetter: true },
  { key: "dofBase", label: "Base DOF", group: "Degrees of Freedom", format: "text" },

  // ----- Payload -----
  { key: "usablePayload", label: "Usable Payload", unit: "kg", group: "Payload", format: "number", numeric: true, higherIsBetter: true },
  { key: "payloadPerArm", label: "Payload per Arm", unit: "kg", group: "Payload", format: "number", numeric: true, higherIsBetter: true },
  { key: "armPayload", label: "Arm Payload", unit: "kg", group: "Payload", format: "number", numeric: true, higherIsBetter: true },

  // ----- Performance -----
  { key: "batteryLife", label: "Battery Life", unit: "min", group: "Performance", format: "number", numeric: true, higherIsBetter: true },
  { key: "batteryHours", label: "Battery Life", unit: "h", group: "Performance", format: "number", numeric: true, higherIsBetter: true },
  { key: "operationTime", label: "Operation Time", unit: "min", group: "Performance", format: "number", numeric: true, higherIsBetter: true },
  { key: "maxSpeed", label: "Max Speed", unit: "mm/s", group: "Performance", format: "number", numeric: true, higherIsBetter: true },
  { key: "maxSpeedKmh", label: "Max Speed", unit: "km/h", group: "Performance", format: "number", numeric: true, higherIsBetter: true },

  // ----- Compute -----
  { key: "cpu", label: "CPU", group: "Compute", format: "text" },
  { key: "gpu", label: "GPU", group: "Compute", format: "text" },
  { key: "memory", label: "Memory", group: "Compute", format: "text" },
  { key: "aiCompute", label: "AI Compute", group: "Compute", format: "text" },
  { key: "os", label: "OS", group: "Compute", format: "text" },

  // ----- Sensors & Connectivity -----
  { key: "sensors", label: "Sensors", group: "Sensors & Connectivity", format: "list" },
  { key: "connectivity", label: "Connectivity", group: "Sensors & Connectivity", format: "list" },

  // ----- Software & ROS -----
  { key: "rosCompatible", label: "ROS Compatible", group: "Software & ROS", format: "boolean", numeric: true, higherIsBetter: true },
  { key: "rosDistros", label: "ROS Distros", group: "Software & ROS", format: "text" },
  { key: "ros2Support", label: "ROS2 Support", group: "Software & ROS", format: "ros2" },
  { key: "sdkAvailable", label: "SDK Available", group: "Software & ROS", format: "boolean", numeric: true, higherIsBetter: true },
  { key: "apiAvailable", label: "API Available", group: "Software & ROS", format: "boolean", numeric: true, higherIsBetter: true },
  { key: "sdkLanguages", label: "SDK Languages", group: "Software & ROS", format: "list" },
  { key: "simulationSupport", label: "Simulation Support", group: "Software & ROS", format: "list" },
  { key: "llmIntegration", label: "LLM Integration", group: "Software & ROS", format: "boolean", numeric: true, higherIsBetter: true },
  { key: "openSource", label: "Open Source", group: "Software & ROS", format: "boolean", numeric: true, higherIsBetter: true },
  { key: "aiPlatform", label: "AI Platform", group: "Software & ROS", format: "text" },
  { key: "openSourceModel", label: "Open-Source Model", group: "Software & ROS", format: "text" },
  { key: "sdkLinks", label: "SDK / Links", group: "Software & ROS", format: "links" },

  // ----- Arm / Manipulation -----
  { key: "reach", label: "Reach", unit: "mm", group: "Arm & Manipulation", format: "number", numeric: true, higherIsBetter: true },
  { key: "armReach", label: "Arm Reach", unit: "mm", group: "Arm & Manipulation", format: "number", numeric: true, higherIsBetter: true },
  { key: "armDof", label: "Arm DOF", group: "Arm & Manipulation", format: "number", numeric: true, higherIsBetter: true },
  { key: "forceSensor", label: "Force Sensor", group: "Arm & Manipulation", format: "boolean", numeric: true, higherIsBetter: true },
  { key: "eoatCompatibility", label: "EOAT Compatibility", group: "Arm & Manipulation", format: "text" },
  { key: "driveSystem", label: "Drive System", group: "Arm & Manipulation", format: "text" },
  { key: "certifications", label: "Certifications", group: "Arm & Manipulation", format: "text" },
  { key: "functions", label: "Functions", group: "Arm & Manipulation", format: "text" },

  // ----- Curated research scores (1-5) -----
  { key: "scoreSdkOpenness", label: "SDK Openness (score)", group: "Research Scores", format: "number", numeric: true, higherIsBetter: true, scoreMax: 5 },
  { key: "scoreRos2Support", label: "ROS2 Support (score)", group: "Research Scores", format: "number", numeric: true, higherIsBetter: true, scoreMax: 5 },
  { key: "scoreComputePower", label: "Compute Power (score)", group: "Research Scores", format: "number", numeric: true, higherIsBetter: true, scoreMax: 5 },
  { key: "scoreSimulationSupport", label: "Simulation (score)", group: "Research Scores", format: "number", numeric: true, higherIsBetter: true, scoreMax: 5 },
  { key: "scoreDeveloperCommunity", label: "Developer Community (score)", group: "Research Scores", format: "number", numeric: true, higherIsBetter: true, scoreMax: 5 },
  { key: "scorePayloadCapability", label: "Payload Capability (score)", group: "Research Scores", format: "number", numeric: true, higherIsBetter: true, scoreMax: 5 },
  { key: "scoreDexterity", label: "Dexterity (score)", group: "Research Scores", format: "number", numeric: true, higherIsBetter: true, scoreMax: 5 },
  { key: "scoreResearchOverall", label: "Research Overall (score)", group: "Research Scores", format: "number", numeric: true, higherIsBetter: true, scoreMax: 5 },

  // ----- Narrative -----
  { key: "researchNote", label: "Research Note", group: "Narrative", format: "text" },
  { key: "remarks", label: "Remarks", group: "Narrative", format: "text" },
  { key: "websiteUrl", label: "Website", group: "Narrative", format: "link" },
];

export const FIELD_GROUPS: string[] = [
  "Overview",
  "Physical",
  "Degrees of Freedom",
  "Payload",
  "Performance",
  "Compute",
  "Sensors & Connectivity",
  "Software & ROS",
  "Arm & Manipulation",
  "Research Scores",
  "Narrative",
];

export const NUMERIC_FIELDS: RobotField[] = ROBOT_FIELDS.filter((f) => f.numeric);

export function getField(key: string): RobotField | undefined {
  return ROBOT_FIELDS.find((f) => f.key === key);
}

export const ROBOT_TYPE_LABELS: Record<string, string> = {
  mobile_manipulator: "Mobile Manipulator",
  mobile_base: "Mobile Base",
  manipulator_arm: "Manipulator Arm",
  humanoid: "Humanoid",
};
