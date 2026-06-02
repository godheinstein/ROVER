import { double, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** OAuth identifier (openId) for OAuth logins. Optional for email/password auth. */
  openId: varchar("openId", { length: 64 }).unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }).unique(),
  password: varchar("password", { length: 255 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Robot category enum. Covers mobile manipulators / bases / arms (from the
 * Query System) plus humanoids (from the Humanoid dashboard) so a single
 * `robots` table can describe every platform family.
 */
export const robotTypeEnum = mysqlEnum("robot_type", [
  "mobile_manipulator",
  "mobile_base",
  "manipulator_arm",
  "humanoid",
]);

/**
 * Unified robots table — a superset of the mobile-manipulator schema and the
 * humanoid schema. Almost every field is nullable because each robot family
 * only populates the columns that apply to it.
 */
export const robots = mysqlTable("robots", {
  id: int("id").autoincrement().primaryKey(),

  // ----- Basic Information -----
  name: varchar("name", { length: 255 }).notNull(),
  manufacturer: varchar("manufacturer", { length: 255 }),
  type: robotTypeEnum.notNull(),
  country: varchar("country", { length: 128 }),
  year: int("year"),

  // ----- Physical Specifications -----
  length: int("length"), // footprint length, mm
  width: int("width"), // footprint width, mm
  height: int("height"), // height, mm
  heightCm: double("height_cm"), // total standing height (humanoids), cm
  heightNote: text("height_note"),
  weight: int("weight"), // kg
  usablePayload: int("usable_payload"), // kg (mobile platforms)
  locomotion: varchar("locomotion", { length: 255 }),
  ipRating: varchar("ip_rating", { length: 32 }),
  priceUsd: varchar("price_usd", { length: 128 }), // free-form: "$50,000 – $75,000"

  // ----- Functional Specifications -----
  functions: text("functions"),
  reach: int("reach"), // mm
  driveSystem: varchar("drive_system", { length: 255 }),
  certifications: text("certifications"),

  // ----- Degrees of Freedom -----
  dofTotal: int("dof_total"),
  dofNote: text("dof_note"),
  dofHead: int("dof_head"),
  dofTorso: int("dof_torso"),
  dofArmEach: int("dof_arm_each"),
  dofHandEach: int("dof_hand_each"),
  dofBase: varchar("dof_base", { length: 255 }),

  // ----- Payload -----
  payloadPerArm: double("payload_per_arm"), // kg
  payloadNote: text("payload_note"),

  // ----- Performance -----
  operationTime: int("operation_time"), // minutes
  batteryLife: int("battery_life"), // minutes
  batteryHours: double("battery_hours"), // hours (humanoids)
  batteryNote: text("battery_note"),
  maxSpeed: int("max_speed"), // mm/s (mobile platforms)
  maxSpeedKmh: double("max_speed_kmh"), // km/h (humanoids)

  // ----- Onboard Compute -----
  cpu: text("cpu"),
  gpu: text("gpu"),
  memory: varchar("memory", { length: 255 }),
  aiCompute: varchar("ai_compute", { length: 255 }),
  os: varchar("os", { length: 128 }),

  // ----- Sensors & Connectivity (string arrays stored as JSON) -----
  sensors: json("sensors").$type<string[]>(),
  connectivity: json("connectivity").$type<string[]>(),

  // ----- Integration / SDK / ROS -----
  rosCompatible: int("ros_compatible").default(0), // 0/1
  rosDistros: text("ros_distros"),
  ros2Support: varchar("ros2_support", { length: 32 }), // native | via-bridge | official-driver | not-confirmed | none
  ros2Note: text("ros2_note"),
  sdkAvailable: int("sdk_available").default(0), // 0/1
  apiAvailable: int("api_available").default(0), // 0/1
  sdkLanguages: json("sdk_languages").$type<string[]>(),
  simulationSupport: json("simulation_support").$type<string[]>(),
  sdkLinks: json("sdk_links").$type<{ label: string; url: string; type: string }[]>(),
  llmIntegration: int("llm_integration").default(0), // 0/1
  openSource: int("open_source").default(0), // 0/1
  aiPlatform: text("ai_platform"),
  openSourceModel: text("open_source_model"),

  // ----- Arm-Specific (manipulator_arm / mobile_manipulator) -----
  forceSensor: int("force_sensor").default(0), // 0/1
  eoatCompatibility: text("eoat_compatibility"),
  armPayload: int("arm_payload"), // kg
  armReach: int("arm_reach"), // mm
  armDof: int("arm_dof"),

  // ----- Curated research scores (1-5) -----
  scoreSdkOpenness: int("score_sdk_openness"),
  scoreRos2Support: int("score_ros2_support"),
  scoreComputePower: int("score_compute_power"),
  scoreSimulationSupport: int("score_simulation_support"),
  scoreDeveloperCommunity: int("score_developer_community"),
  scorePayloadCapability: int("score_payload_capability"),
  scoreDexterity: int("score_dexterity"),
  scoreResearchOverall: int("score_research_overall"),

  // ----- Narrative / Recommendation -----
  summary: text("summary"),
  researchNote: text("research_note"),
  recommendation: varchar("recommendation", { length: 32 }), // top | strong | good | moderate | not-recommended

  // ----- Additional / Metadata -----
  websiteUrl: varchar("website_url", { length: 512 }),
  remarks: text("remarks"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow().notNull(),
  createdBy: int("created_by").references(() => users.id),
});

export type Robot = typeof robots.$inferSelect;
export type InsertRobot = typeof robots.$inferInsert;
