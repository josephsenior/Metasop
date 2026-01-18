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
    name: prismaUser.name || undefined,
    image: prismaUser.image || undefined,
    role: prismaUser.role as "admin" | "user",
    emailVerified: !!prismaUser.emailVerified,
    isActive: prismaUser.isActive,
    createdAt: toISOString(prismaUser.createdAt) || new Date().toISOString(),
    updatedAt: toISOString(prismaUser.updatedAt) || new Date().toISOString(),
    lastLogin: toISOString(prismaUser.lastLogin),
    subscriptionPlan: prismaUser.subscriptionPlan as "free" | "pro" | "teams" | "enterprise" | undefined,
    hasPassword: !!prismaUser.passwordHash,
  };
}

export const db = {
  // User operations
  async createUser(data: {
    email: string;
    username: string;
    name?: string;
    image?: string;
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
      const userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
      const user: any = {
        id: userId,
        email: data.email,
        username: data.username,
        name: data.name || null,
        image: data.image || null,
        passwordHash: hashedPassword,
        role: "user",
        emailVerified: false,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLogin: null,
        subscriptionPlan: null,
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
        name: data.name,
        image: data.image,
        passwordHash: hashedPassword,
        role: "user",
        isActive: true,
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
      if (!storedUser || !storedUser.passwordHash) return false;
      return await bcrypt.compare(password, storedUser.passwordHash);
    }

    const prismaUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });

    if (!prismaUser || !prismaUser.passwordHash) return false;

    return await bcrypt.compare(password, prismaUser.passwordHash);
  },

  async updateUserLastLogin(userId: string): Promise<void> {
    const dbAvailable = await checkDatabaseConnection();

    if (!dbAvailable) {
      // In-memory fallback
      const user = inMemoryUsers.get(userId);
      if (user) {
        user.lastLogin = new Date();
        user.updatedAt = new Date();
      }
      return;
    }

    await prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
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
      if (data.name !== undefined) user.name = data.name;
      if (data.image !== undefined) user.image = data.image;
      if (data.role !== undefined) user.role = data.role;
      if (data.emailVerified !== undefined) user.emailVerified = data.emailVerified;
      if (data.isActive !== undefined) user.isActive = data.isActive;
      if (data.subscriptionPlan !== undefined) user.subscriptionPlan = data.subscriptionPlan;
      user.updatedAt = new Date();

      return prismaUserToUser(user);
    }

    const updateData: any = {};

    if (data.email !== undefined) updateData.email = data.email;
    if (data.username !== undefined) updateData.username = data.username;
    if (data.name !== undefined) updateData.name = data.name;
    if (data.image !== undefined) updateData.image = data.image;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.emailVerified !== undefined) {
      updateData.emailVerified = data.emailVerified ? new Date() : null;
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.subscriptionPlan !== undefined) updateData.subscriptionPlan = data.subscriptionPlan;

    const prismaUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return prismaUserToUser(prismaUser);
  },

  // Password reset operations
  async createResetToken(email: string): Promise<string> {
    const dbAvailable = await checkDatabaseConnection();
    const token = `reset_${Date.now()}_${Math.random().toString(36).substring(2, 18)}`;
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
        user.passwordHash = hashedPassword;
        user.updatedAt = new Date();
      }
      return;
    }

    await prisma.user.update({
      where: { email },
      data: { passwordHash: hashedPassword },
    });
  },
};

// Helper to hash passwords
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

// Helper to compare passwords
export async function comparePassword(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(plainPassword, hashedPassword);
}
