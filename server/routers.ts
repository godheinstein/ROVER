import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, adminProcedure, router } from "./_core/trpc";
import { z } from "zod";

// Robot category enum shared across procedures.
const robotTypeSchema = z.enum([
  "mobile_manipulator",
  "mobile_base",
  "manipulator_arm",
  "humanoid",
]);

// Every robot field as an optional zod type. `create`/`bulkUpload` override
// `name` and `type` to be required; `update` adds an `id`.
const optionalRobotFields = {
  name: z.string().optional(),
  manufacturer: z.string().optional(),
  type: robotTypeSchema.optional(),
  country: z.string().optional(),
  year: z.number().optional(),

  length: z.number().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
  heightCm: z.number().optional(),
  heightNote: z.string().optional(),
  weight: z.number().optional(),
  usablePayload: z.number().optional(),
  locomotion: z.string().optional(),
  ipRating: z.string().optional(),
  priceUsd: z.string().optional(),

  functions: z.string().optional(),
  reach: z.number().optional(),
  driveSystem: z.string().optional(),
  certifications: z.string().optional(),

  dofTotal: z.number().optional(),
  dofNote: z.string().optional(),
  dofHead: z.number().optional(),
  dofTorso: z.number().optional(),
  dofArmEach: z.number().optional(),
  dofHandEach: z.number().optional(),
  dofBase: z.string().optional(),

  payloadPerArm: z.number().optional(),
  payloadNote: z.string().optional(),

  operationTime: z.number().optional(),
  batteryLife: z.number().optional(),
  batteryHours: z.number().optional(),
  batteryNote: z.string().optional(),
  maxSpeed: z.number().optional(),
  maxSpeedKmh: z.number().optional(),

  cpu: z.string().optional(),
  gpu: z.string().optional(),
  memory: z.string().optional(),
  aiCompute: z.string().optional(),
  os: z.string().optional(),

  sensors: z.array(z.string()).optional(),
  connectivity: z.array(z.string()).optional(),

  rosCompatible: z.number().optional(),
  rosDistros: z.string().optional(),
  ros2Support: z.string().optional(),
  ros2Note: z.string().optional(),
  sdkAvailable: z.number().optional(),
  apiAvailable: z.number().optional(),
  sdkLanguages: z.array(z.string()).optional(),
  simulationSupport: z.array(z.string()).optional(),
  sdkLinks: z
    .array(z.object({ label: z.string(), url: z.string(), type: z.string() }))
    .optional(),
  llmIntegration: z.number().optional(),
  openSource: z.number().optional(),
  aiPlatform: z.string().optional(),
  openSourceModel: z.string().optional(),

  forceSensor: z.number().optional(),
  eoatCompatibility: z.string().optional(),
  armPayload: z.number().optional(),
  armReach: z.number().optional(),
  armDof: z.number().optional(),

  scoreSdkOpenness: z.number().optional(),
  scoreRos2Support: z.number().optional(),
  scoreComputePower: z.number().optional(),
  scoreSimulationSupport: z.number().optional(),
  scoreDeveloperCommunity: z.number().optional(),
  scorePayloadCapability: z.number().optional(),
  scoreDexterity: z.number().optional(),
  scoreResearchOverall: z.number().optional(),

  summary: z.string().optional(),
  researchNote: z.string().optional(),
  recommendation: z.string().optional(),

  websiteUrl: z.string().optional(),
  remarks: z.string().optional(),
};

const createRobotSchema = z.object({
  ...optionalRobotFields,
  name: z.string(),
  type: robotTypeSchema,
});

const updateRobotSchema = z.object({
  ...optionalRobotFields,
  id: z.number(),
});

export const appRouter = router({
    // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  robots: router({
    // Public procedures for searching and viewing robots
    list: publicProcedure.query(async () => {
      const { getAllRobots } = await import("./db");
      return getAllRobots();
    }),

    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const { getRobotById } = await import("./db");
        return getRobotById(input.id);
      }),

    search: publicProcedure
      .input(
        z.object({
          type: z.string().optional(),
          manufacturer: z.string().optional(),
          country: z.string().optional(),
          minPayload: z.number().optional(),
          maxPayload: z.number().optional(),
          minReach: z.number().optional(),
          maxReach: z.number().optional(),
          rosCompatible: z.boolean().optional(),
          ros2Support: z.string().optional(),
          driveSystem: z.string().optional(),
          minArmDof: z.number().optional(),
          minDofTotal: z.number().optional(),
          forceSensor: z.boolean().optional(),
          llmIntegration: z.boolean().optional(),
          openSource: z.boolean().optional(),
          minYear: z.number().optional(),
          keyword: z.string().optional(),
        })
      )
      .query(async ({ input }) => {
        const { searchRobots } = await import("./db");
        return searchRobots(input);
      }),

    naturalLanguageQuery: publicProcedure
      .input(z.object({ query: z.string() }))
      .mutation(async ({ input }) => {
        const { searchRobots } = await import("./db");
        const { OpenAI } = await import("openai");

        const openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
        });

        // Use LLM to parse natural language query into structured filters
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a robot query assistant for a database of mobile manipulators, mobile bases, manipulator arms, and humanoid robots. Parse the user's natural language query into structured search filters.

              Available filters:
              - type: "mobile_manipulator" | "mobile_base" | "manipulator_arm" | "humanoid"
              - manufacturer: string (partial match)
              - country: string (partial match, e.g. "China", "USA")
              - minPayload: number (kg) — matches mobile payload or per-arm payload
              - maxPayload: number (kg)
              - minReach: number (mm)
              - maxReach: number (mm)
              - rosCompatible: boolean
              - ros2Support: "native" | "via-bridge" | "official-driver" | "not-confirmed" | "none"
              - driveSystem: string
              - minArmDof: number (arm degrees of freedom)
              - minDofTotal: number (total degrees of freedom, useful for humanoids)
              - forceSensor: boolean
              - llmIntegration: boolean (onboard LLM/VLA support)
              - openSource: boolean (open-source SDK)
              - minYear: number (release year)
              - keyword: string (free-text match on name/manufacturer/functions/summary)

              Return ONLY a JSON object with the applicable filters. Use null for filters that do not apply.
              Do not include explanations or markdown formatting.`,
            },
            {
              role: "user",
              content: input.query,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "robot_filters",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  type: { type: ["string", "null"] },
                  manufacturer: { type: ["string", "null"] },
                  country: { type: ["string", "null"] },
                  minPayload: { type: ["number", "null"] },
                  maxPayload: { type: ["number", "null"] },
                  minReach: { type: ["number", "null"] },
                  maxReach: { type: ["number", "null"] },
                  rosCompatible: { type: ["boolean", "null"] },
                  ros2Support: { type: ["string", "null"] },
                  driveSystem: { type: ["string", "null"] },
                  minArmDof: { type: ["number", "null"] },
                  minDofTotal: { type: ["number", "null"] },
                  forceSensor: { type: ["boolean", "null"] },
                  llmIntegration: { type: ["boolean", "null"] },
                  openSource: { type: ["boolean", "null"] },
                  minYear: { type: ["number", "null"] },
                  keyword: { type: ["string", "null"] },
                },
                required: [
                  "type",
                  "manufacturer",
                  "country",
                  "minPayload",
                  "maxPayload",
                  "minReach",
                  "maxReach",
                  "rosCompatible",
                  "ros2Support",
                  "driveSystem",
                  "minArmDof",
                  "minDofTotal",
                  "forceSensor",
                  "llmIntegration",
                  "openSource",
                  "minYear",
                  "keyword",
                ],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0]?.message?.content;
        const filterStr = typeof content === "string" ? content : "{}";
        const parsed = JSON.parse(filterStr) as Record<string, unknown>;

        // Drop the nulls that the strict schema forces the model to emit.
        const filters: Record<string, any> = {};
        for (const [key, value] of Object.entries(parsed)) {
          if (value !== null && value !== undefined && value !== "") {
            filters[key] = value;
          }
        }

        const results = await searchRobots(filters);

        return {
          filters,
          results,
          explanation: `Found ${results.length} robot(s) matching your query.`,
        };
      }),

    // Admin-only procedures for managing the database
    create: adminProcedure
      .input(createRobotSchema)
      .mutation(async ({ input, ctx }) => {
        const { createRobot } = await import("./db");
        return createRobot({ ...input, createdBy: ctx.user.id });
      }),

    update: adminProcedure
      .input(updateRobotSchema)
      .mutation(async ({ input }) => {
        const { updateRobot } = await import("./db");
        const { id, ...data } = input;
        return updateRobot(id, data);
      }),

    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input }) => {
        const { deleteRobot } = await import("./db");
        await deleteRobot(input.id);
        return { success: true };
      }),

    bulkUpload: adminProcedure
      .input(z.object({ robots: z.array(createRobotSchema) }))
      .mutation(async ({ input, ctx }) => {
        const { createRobot } = await import("./db");
        const results = [];
        const errors = [];

        for (const robot of input.robots) {
          try {
            const created = await createRobot({ ...robot, createdBy: ctx.user.id });
            results.push(created);
          } catch (error) {
            errors.push({
              robot: robot.name,
              error: error instanceof Error ? error.message : "Unknown error",
            });
          }
        }

        return {
          success: results.length,
          failed: errors.length,
          errors,
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
