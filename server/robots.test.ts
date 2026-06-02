import { describe, expect, it, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

function createPublicContext(): { ctx: TrpcContext } {
  const ctx: TrpcContext = {
    user: undefined,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("robots.list", () => {
  it("should return all robots without authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.robots.list();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it("should return robots with expected properties", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.robots.list();

    if (result.length > 0) {
      const robot = result[0];
      expect(robot).toHaveProperty("id");
      expect(robot).toHaveProperty("name");
      expect(robot).toHaveProperty("type");
      expect(["mobile_manipulator", "mobile_base", "manipulator_arm"]).toContain(robot.type);
    }
  });
});

describe("robots.search", () => {
  it("should filter robots by type", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.robots.search({ type: "mobile_base" });

    expect(Array.isArray(result)).toBe(true);
    result.forEach((robot) => {
      expect(robot.type).toBe("mobile_base");
    });
  });

  it("should filter robots by ROS compatibility", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.robots.search({ rosCompatible: true });

    expect(Array.isArray(result)).toBe(true);
    result.forEach((robot) => {
      expect(robot.rosCompatible).toBe(1);
    });
  });

  it("should filter robots by minimum payload", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const minPayload = 50;
    const result = await caller.robots.search({ minPayload });

    expect(Array.isArray(result)).toBe(true);
    result.forEach((robot) => {
      if (robot.usablePayload !== null) {
        expect(robot.usablePayload).toBeGreaterThanOrEqual(minPayload);
      }
    });
  });

  it("should filter robots with force sensors", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.robots.search({ forceSensor: true });

    expect(Array.isArray(result)).toBe(true);
    result.forEach((robot) => {
      expect(robot.forceSensor).toBe(1);
    });
  });
});

describe("robots.create", () => {
  it("should create a new robot when authenticated", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const newRobot = {
      name: "Test Robot",
      manufacturer: "Test Manufacturer",
      type: "mobile_base" as const,
      usablePayload: 50,
      rosCompatible: 1,
    };

    const result = await caller.robots.create(newRobot);

    expect(result).toHaveProperty("id");
    expect(result.name).toBe(newRobot.name);
    expect(result.manufacturer).toBe(newRobot.manufacturer);
    expect(result.type).toBe(newRobot.type);
  });

  it("should fail to create robot without authentication", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const newRobot = {
      name: "Test Robot",
      type: "mobile_base" as const,
    };

    await expect(caller.robots.create(newRobot)).rejects.toThrow();
  });
});

describe("robots.naturalLanguageQuery", () => {
  it("should process natural language query and return results", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.robots.naturalLanguageQuery({
      query: "Find robots with ROS support",
    });

    expect(result).toHaveProperty("filters");
    expect(result).toHaveProperty("results");
    expect(result).toHaveProperty("explanation");
    expect(Array.isArray(result.results)).toBe(true);
  });

  it("should extract filters from natural language", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.robots.naturalLanguageQuery({
      query: "Show me mobile manipulators with force sensors",
    });

    expect(result.filters).toBeDefined();
    expect(typeof result.filters).toBe("object");
  });
});

describe("robots.getById", () => {
  it("should return a specific robot by id", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    // First get all robots to get a valid ID
    const allRobots = await caller.robots.list();
    if (allRobots.length > 0) {
      const firstRobotId = allRobots[0]!.id;
      
      const result = await caller.robots.getById({ id: firstRobotId });

      expect(result).toBeDefined();
      expect(result?.id).toBe(firstRobotId);
    }
  });

  it("should return undefined for non-existent robot", async () => {
    const { ctx } = createPublicContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.robots.getById({ id: 999999 });

    expect(result).toBeUndefined();
  });
});
