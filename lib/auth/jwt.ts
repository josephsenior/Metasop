import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"; // 7 days

export interface TokenPayload {
  userId: string;
  email: string;
  role: "admin" | "user";
}

export function generateToken(payload: TokenPayload): string {
  if (!JWT_SECRET || JWT_SECRET === "your-secret-key-change-in-production") {
    throw new Error("JWT_SECRET is not configured properly");
  }
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  } as jwt.SignOptions);
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as TokenPayload;
  } catch {
    throw new Error("Invalid or expired token");
  }
}

export function getTokenExpiration(): number {
  // Calculate expiration in seconds
  const expiresIn = JWT_EXPIRES_IN;
  if (expiresIn.endsWith("d")) {
    return parseInt(expiresIn) * 24 * 60 * 60;
  } else if (expiresIn.endsWith("h")) {
    return parseInt(expiresIn) * 60 * 60;
  } else if (expiresIn.endsWith("m")) {
    return parseInt(expiresIn) * 60;
  }
  return 7 * 24 * 60 * 60; // Default 7 days
}

