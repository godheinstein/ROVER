import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, InsertRobot, Robot, robots } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.email, email)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createUser(user: InsertUser) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(users).values(user);
  return result;
}

// Robot database helpers

export async function createRobot(robot: InsertRobot): Promise<Robot> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.insert(robots).values(robot);
  const insertedId = Number(result[0].insertId);
  
  const inserted = await db.select().from(robots).where(eq(robots.id, insertedId)).limit(1);
  if (!inserted[0]) {
    throw new Error("Failed to retrieve inserted robot");
  }
  
  return inserted[0];
}

export async function updateRobot(id: number, robot: Partial<InsertRobot>): Promise<Robot> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.update(robots).set(robot).where(eq(robots.id, id));
  
  const updated = await db.select().from(robots).where(eq(robots.id, id)).limit(1);
  if (!updated[0]) {
    throw new Error("Robot not found after update");
  }
  
  return updated[0];
}

export async function deleteRobot(id: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  await db.delete(robots).where(eq(robots.id, id));
}

export async function getRobotById(id: number): Promise<Robot | undefined> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const result = await db.select().from(robots).where(eq(robots.id, id)).limit(1);
  return result[0];
}

export async function getAllRobots(): Promise<Robot[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  return db.select().from(robots).orderBy(desc(robots.createdAt));
}

export interface RobotFilters {
  type?: string;
  manufacturer?: string;
  country?: string;
  minPayload?: number;
  maxPayload?: number;
  minReach?: number;
  maxReach?: number;
  rosCompatible?: boolean;
  ros2Support?: string;
  driveSystem?: string;
  minArmDof?: number;
  minDofTotal?: number;
  forceSensor?: boolean;
  llmIntegration?: boolean;
  openSource?: boolean;
  minYear?: number;
  keyword?: string;
}

export async function searchRobots(filters: RobotFilters): Promise<Robot[]> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  const conditions = [];

  if (filters.type) {
    conditions.push(eq(robots.type, filters.type as any));
  }
  if (filters.manufacturer) {
    conditions.push(like(robots.manufacturer, `%${filters.manufacturer}%`));
  }
  if (filters.country) {
    conditions.push(like(robots.country, `%${filters.country}%`));
  }
  if (filters.minPayload !== undefined) {
    // Match either the mobile-platform payload or the per-arm payload.
    conditions.push(
      sql`(${robots.usablePayload} >= ${filters.minPayload} OR ${robots.payloadPerArm} >= ${filters.minPayload})`
    );
  }
  if (filters.maxPayload !== undefined) {
    conditions.push(
      sql`(${robots.usablePayload} <= ${filters.maxPayload} OR ${robots.payloadPerArm} <= ${filters.maxPayload})`
    );
  }
  if (filters.minReach !== undefined) {
    conditions.push(sql`${robots.reach} >= ${filters.minReach}`);
  }
  if (filters.maxReach !== undefined) {
    conditions.push(sql`${robots.reach} <= ${filters.maxReach}`);
  }
  if (filters.rosCompatible !== undefined) {
    conditions.push(eq(robots.rosCompatible, filters.rosCompatible ? 1 : 0));
  }
  if (filters.ros2Support) {
    conditions.push(eq(robots.ros2Support, filters.ros2Support));
  }
  if (filters.driveSystem) {
    conditions.push(like(robots.driveSystem, `%${filters.driveSystem}%`));
  }
  if (filters.minArmDof !== undefined) {
    conditions.push(sql`${robots.armDof} >= ${filters.minArmDof}`);
  }
  if (filters.minDofTotal !== undefined) {
    conditions.push(sql`${robots.dofTotal} >= ${filters.minDofTotal}`);
  }
  if (filters.forceSensor !== undefined) {
    conditions.push(eq(robots.forceSensor, filters.forceSensor ? 1 : 0));
  }
  if (filters.llmIntegration !== undefined) {
    conditions.push(eq(robots.llmIntegration, filters.llmIntegration ? 1 : 0));
  }
  if (filters.openSource !== undefined) {
    conditions.push(eq(robots.openSource, filters.openSource ? 1 : 0));
  }
  if (filters.minYear !== undefined) {
    conditions.push(sql`${robots.year} >= ${filters.minYear}`);
  }
  if (filters.keyword) {
    const kw = `%${filters.keyword}%`;
    conditions.push(
      or(
        like(robots.name, kw),
        like(robots.manufacturer, kw),
        like(robots.functions, kw),
        like(robots.summary, kw)
      )
    );
  }

  if (conditions.length === 0) {
    return getAllRobots();
  }

  return db.select().from(robots).where(and(...conditions)).orderBy(desc(robots.createdAt));
}
