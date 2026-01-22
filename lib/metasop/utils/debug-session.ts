/**
 * Debug Session Manager
 * Creates isolated debug folders for each generation run
 */

import * as fs from "fs";
import * as path from "path";
import { logger } from "./logger";

/**
 * Generate a unique session ID for debug logging
 * Format: YYYY-MM-DD_HH-MM-SS_XXXX (where XXXX is a random suffix)
 */
export function generateSessionId(): string {
    const now = new Date();
    const date = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const time = now.toTimeString().split(' ')[0].replace(/:/g, '-'); // HH-MM-SS
    const random = Math.random().toString(36).substring(2, 6); // 4 random chars
    return `${date}_${time}_${random}`;
}

/**
 * Debug session context
 */
export interface DebugSession {
    sessionId: string;
    sessionDir: string;
    startTime: Date;
    userRequest: string;
}

/**
 * Create a new debug session folder
 */
export function createDebugSession(userRequest: string): DebugSession {
    const sessionId = generateSessionId();
    const debugBaseDir = path.join(process.cwd(), 'debug_logs');
    const sessionDir = path.join(debugBaseDir, sessionId);

    try {
        if (!fs.existsSync(debugBaseDir)) {
            fs.mkdirSync(debugBaseDir, { recursive: true });
        }
        fs.mkdirSync(sessionDir, { recursive: true });

        // Write session metadata
        const metadata = {
            sessionId,
            startTime: new Date().toISOString(),
            userRequest: userRequest.substring(0, 500), // Truncate for metadata
            nodeVersion: process.version,
            platform: process.platform,
        };

        fs.writeFileSync(
            path.join(sessionDir, '_session_info.json'),
            JSON.stringify(metadata, null, 2)
        );

        logger.info("Debug session created", { sessionId, sessionDir });

        return {
            sessionId,
            sessionDir,
            startTime: new Date(),
            userRequest,
        };
    } catch (error: any) {
        logger.error("Failed to create debug session", { error: error.message });
        // Fallback to root debug_logs if session folder creation fails
        return {
            sessionId,
            sessionDir: debugBaseDir,
            startTime: new Date(),
            userRequest,
        };
    }
}

/**
 * Write debug artifact to session folder
 */
export function writeDebugArtifact(
    session: DebugSession,
    agentRole: string,
    artifactType: 'request' | 'response' | 'error' | 'artifact',
    data: any
): string | null {
    try {
        const filename = `${agentRole.toLowerCase().replace(/\s+/g, '_')}_${artifactType}.json`;
        const filepath = path.join(session.sessionDir, filename);

        fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

        logger.debug(`Debug artifact written: ${filename}`, { sessionId: session.sessionId });
        return filepath;
    } catch (error: any) {
        logger.error("Failed to write debug artifact", { 
            sessionId: session.sessionId, 
            agentRole, 
            artifactType, 
            error: error.message 
        });
        return null;
    }
}

/**
 * Write session summary after orchestration completes
 */
export function writeSessionSummary(
    session: DebugSession,
    result: {
        success: boolean;
        duration: number;
        agentsCompleted: string[];
        agentsFailed: string[];
        error?: string;
    }
): void {
    try {
        const summary = {
            sessionId: session.sessionId,
            startTime: session.startTime.toISOString(),
            endTime: new Date().toISOString(),
            durationMs: result.duration,
            durationFormatted: `${(result.duration / 1000).toFixed(2)}s`,
            success: result.success,
            agentsCompleted: result.agentsCompleted,
            agentsFailed: result.agentsFailed,
            error: result.error,
            userRequest: session.userRequest.substring(0, 200) + '...',
        };

        fs.writeFileSync(
            path.join(session.sessionDir, '_session_summary.json'),
            JSON.stringify(summary, null, 2)
        );

        logger.info("Debug session summary written", { sessionId: session.sessionId, success: result.success });
    } catch (error: any) {
        logger.error("Failed to write session summary", { error: error.message });
    }
}

/**
 * Global session reference (set by orchestrator at run start)
 */
let currentSession: DebugSession | null = null;

export function setCurrentSession(session: DebugSession | null): void {
    currentSession = session;
}

export function getCurrentSession(): DebugSession | null {
    return currentSession;
}

/**
 * Get session directory path for external use (e.g., gemini-adapter)
 */
export function getSessionDebugDir(): string {
    if (currentSession) {
        return currentSession.sessionDir;
    }
    // Fallback to root debug_logs
    return path.join(process.cwd(), 'debug_logs');
}
