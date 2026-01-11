import { prisma } from "../database";
import bcrypt from "bcryptjs";
import type { User } from "@/types/auth";

// Fallback in-memory storage for development when database is unavailable
let useInMemoryFallback = false;
const inMemoryUsers = new Map<string, any>();
const inMemoryResetTokens = new Map<string, any>();

/**
 * Check if database is available, fallback to in-memory if not
 */
async function checkDatabaseConnection(): Promise<boolean> {
  if (useInMemoryFallback) return false;

  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    console.warn("⚠️  Database connection failed, using in-memory fallback for development");
    useInMemoryFallback = true;
    return false;
  }
}

// Helper to convert Prisma User to our User type
function prismaUserToUser(prismaUser: any): User {
  // Handle both Prisma Date objects and regular Date objects
  const toISOString = (date: any) => {
    if (!date) return null;
    if (typeof date === "string") return date;
    if (date instanceof Date) return date.toISOString();
    if (date.toISOString) return date.toISOString();
    return new Date(date).toISOString();
  };

  return {
    id: prismaUser.id,
    email: prismaUser.email,
    username: prismaUser.username,
    full_name: prismaUser.full_name || undefined,
    role: prismaUser.role as "admin" | "user",
    email_verified: prismaUser.email_verified,
    is_active: prismaUser.is_active,
    created_at: toISOString(prismaUser.created_at) || new Date().toISOString(),
    updated_at: toISOString(prismaUser.updated_at) || new Date().toISOString(),
    last_login: toISOString(prismaUser.last_login),
    subscription_plan: prismaUser.subscription_plan as "free" | "pro" | "teams" | "enterprise" | undefined,
  };
}

export const db = {
  // User operations
  async createUser(data: {
    email: string;
    username: string;
    full_name?: string;
    password: string;
  }): Promise<User> {
    const dbAvailable = await checkDatabaseConnection();

    if (!dbAvailable) {
      // In-memory fallback
      // Check if user already exists
      for (const user of inMemoryUsers.values()) {
        if (user.email === data.email) {
          throw new Error("User with this email already exists");
        }
        if (user.username === data.username) {
          throw new Error("Username already taken");
        }
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create user in memory
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const user: any = {
        id: userId,
        email: data.email,
        username: data.username,
        full_name: data.full_name || null,
        password_hash: hashedPassword,
        role: "user",
        email_verified: false,
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
        last_login: null,
        subscription_plan: null,
      };

      inMemoryUsers.set(userId, user);
      inMemoryUsers.set(data.email, user); // Index by email
      inMemoryUsers.set(data.username, user); // Index by username

      return prismaUserToUser(user);
    }

    // Database available - use Prisma
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username },
        ],
      },
    });

    if (existingUser) {
      if (existingUser.email === data.email) {
        throw new Error("User with this email already exists");
      }
      if (existingUser.username === data.username) {
        throw new Error("Username already taken");
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const prismaUser = await prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        full_name: data.full_name,
        password_hash: hashedPassword,
        role: "user",
        email_verified: false,
        is_active: true,
      },
    });

    return prismaUserToUser(prismaUser);
  },

  async findUserByEmail(email: string): Promise<User | null> {
    const dbAvailable = await checkDatabaseConnection();

    if (!dbAvailable) {
      // In-memory fallback
      const user = inMemoryUsers.get(email);
      return user ? prismaUserToUser(user) : null;
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    return user ? prismaUserToUser(user) : null;
  },

  async findUserByUsername(username: string): Promise<User | null> {
    const dbAvailable = await checkDatabaseConnection();

    if (!dbAvailable) {
      // In-memory fallback
      const user = inMemoryUsers.get(username);
      return user ? prismaUserToUser(user) : null;
    }

    const user = await prisma.user.findUnique({
      where: { username },
    });

    return user ? prismaUserToUser(user) : null;
  },

  async findUserById(id: string): Promise<User | null> {
    const dbAvailable = await checkDatabaseConnection();

    if (!dbAvailable) {
      // In-memory fallback
      const user = inMemoryUsers.get(id);
      return user ? prismaUserToUser(user) : null;
    }

    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user ? prismaUserToUser(user) : null;
  },

  async verifyPassword(user: User, password: string): Promise<boolean> {
    const dbAvailable = await checkDatabaseConnection();

    if (!dbAvailable) {
      // In-memory fallback
      const storedUser = inMemoryUsers.get(user.id);
      if (!storedUser) return false;
      return bcrypt.compare(password, storedUser.password_hash);
    }

    const prismaUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { password_hash: true },
    });

    if (!prismaUser) return false;

    return bcrypt.compare(password, prismaUser.password_hash);
  },

  async updateUserLastLogin(userId: string): Promise<void> {
    const dbAvailable = await checkDatabaseConnection();

    if (!dbAvailable) {
      // In-memory fallback
      const user = inMemoryUsers.get(userId);
      if (user) {
        user.last_login = new Date();
        user.updated_at = new Date();
      }
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { last_login: new Date() },
    });
  },

  async updateUser(userId: string, data: Partial<User>): Promise<User | null> {
    const dbAvailable = await checkDatabaseConnection();

    if (!dbAvailable) {
      // In-memory fallback
      const user = inMemoryUsers.get(userId);
      if (!user) return null;

      if (data.email !== undefined) user.email = data.email;
      if (data.username !== undefined) user.username = data.username;
      if (data.full_name !== undefined) user.full_name = data.full_name;
      if (data.role !== undefined) user.role = data.role;
      if (data.email_verified !== undefined) user.email_verified = data.email_verified;
      if (data.is_active !== undefined) user.is_active = data.is_active;
      if (data.subscription_plan !== undefined) user.subscription_plan = data.subscription_plan;
      user.updated_at = new Date();

      return prismaUserToUser(user);
    }

    const updateData: any = {};

    if (data.email !== undefined) updateData.email = data.email;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.full_name !== undefined) updateData.full_name = data.full_name;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.email_verified !== undefined) updateData.email_verified = data.email_verified;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;
    if (data.subscription_plan !== undefined) updateData.subscription_plan = data.subscription_plan;

    const prismaUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return prismaUserToUser(prismaUser);
  },

  // Password reset operations
  async createResetToken(email: string): Promise<string> {
    const dbAvailable = await checkDatabaseConnection();
    const token = `reset_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    if (!dbAvailable) {
      // In-memory fallback
      // Clean up expired tokens
      for (const [key, tokenData] of inMemoryResetTokens.entries()) {
        if (tokenData.expiresAt < new Date()) {
          inMemoryResetTokens.delete(key);
        }
      }

      inMemoryResetTokens.set(token, { email, expiresAt });
      return token;
    }

    // Clean up expired tokens first
    await prisma.resetToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });

    await prisma.resetToken.create({
      data: {
        token,
        email,
        expiresAt,
      },
    });

    return token;
  },

  async verifyResetToken(token: string): Promise<string | null> {
    const dbAvailable = await checkDatabaseConnection();

    if (!dbAvailable) {
      // In-memory fallback
      const resetToken = inMemoryResetTokens.get(token);
      if (!resetToken) return null;

      if (resetToken.expiresAt < new Date()) {
        inMemoryResetTokens.delete(token);
        return null;
      }

      return resetToken.email;
    }

    const resetToken = await prisma.resetToken.findUnique({
      where: { token },
    });

    if (!resetToken) return null;

    if (resetToken.expiresAt < new Date()) {
      await prisma.resetToken.delete({
        where: { token },
      });
      return null;
    }

    return resetToken.email;
  },

  async deleteResetToken(token: string): Promise<void> {
    const dbAvailable = await checkDatabaseConnection();

    if (!dbAvailable) {
      // In-memory fallback
      inMemoryResetTokens.delete(token);
      return;
    }

    await prisma.resetToken.delete({
      where: { token },
    }).catch(() => {
      // Token might not exist, ignore error
    });
  },

  async updateUserPassword(email: string, newPassword: string): Promise<void> {
    const dbAvailable = await checkDatabaseConnection();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (!dbAvailable) {
      // In-memory fallback
      const user = inMemoryUsers.get(email);
      if (user) {
        user.password_hash = hashedPassword;
        user.updated_at = new Date();
      }
      return;
    }

    await prisma.user.update({
      where: { email },
      data: { password_hash: hashedPassword },
    });
  },
};

// Helper to hash passwords
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

// Helper to compare passwords
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}
