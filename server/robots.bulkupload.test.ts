import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAdminContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "admin-user",
    email: "admin@example.com",
    name: "Admin User",
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

describe("robots.bulkUpload", () => {
  it("successfully uploads multiple robots with website URLs", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const robotsToUpload = [
      {
        name: "Test Bulk Robot 1",
        manufacturer: "Test Manufacturer",
        type: "mobile_base" as const,
        weight: 50,
        usablePayload: 25,
        websiteUrl: "https://example.com/robot1",
        rosCompatible: 1,
        sdkAvailable: 1,
        apiAvailable: 1,
      },
      {
        name: "Test Bulk Robot 2",
        manufacturer: "Test Manufacturer 2",
        type: "manipulator_arm" as const,
        armDof: 6,
        armPayload: 10,
        armReach: 900,
        websiteUrl: "https://example.com/robot2",
        forceSensor: 1,
        rosCompatible: 1,
        sdkAvailable: 0,
        apiAvailable: 1,
      },
    ];

    const result = await caller.robots.bulkUpload({ robots: robotsToUpload });

    expect(result.success).toBe(2);
    expect(result.failed).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it("validates required fields and rejects invalid data", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const robotsToUpload = [
      {
        // Missing required name field - should fail validation
        manufacturer: "Test Manufacturer",
        type: "mobile_base" as const,
        rosCompatible: 1,
        sdkAvailable: 1,
        apiAvailable: 1,
      } as any,
    ];

    // Expect validation error for missing name
    await expect(
      caller.robots.bulkUpload({ robots: robotsToUpload })
    ).rejects.toThrow();
  });
});

describe("robots.create with websiteUrl", () => {
  it("creates a robot with website URL", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const newRobot = await caller.robots.create({
      name: "Test Robot with URL",
      manufacturer: "Test Manufacturer",
      type: "mobile_manipulator",
      websiteUrl: "https://example.com/test-robot",
      usablePayload: 30,
      rosCompatible: 1,
      sdkAvailable: 1,
      apiAvailable: 1,
    });

    expect(newRobot.name).toBe("Test Robot with URL");
    expect(newRobot.websiteUrl).toBe("https://example.com/test-robot");
  });

  it("creates a robot without website URL", async () => {
    const { ctx } = createAdminContext();
    const caller = appRouter.createCaller(ctx);

    const newRobot = await caller.robots.create({
      name: "Test Robot without URL",
      manufacturer: "Test Manufacturer",
      type: "mobile_base",
      rosCompatible: 0,
      sdkAvailable: 1,
      apiAvailable: 0,
    });

    expect(newRobot.name).toBe("Test Robot without URL");
    expect(newRobot.websiteUrl).toBeNull();
  });
});
