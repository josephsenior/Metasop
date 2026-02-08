import { EventEmitter } from "events";
import { randomUUID } from "crypto";
import fs from "fs";
import path from "path";
import type { MetaSOPEvent } from "@/lib/metasop/types";
import { runMetaSOPOrchestration } from "@/lib/metasop/orchestrator";
import { diagramDb } from "@/lib/diagrams/db";
import { checkDatabaseHealth } from "@/lib/database/prisma";
import { recordGuestDiagramCreation } from "@/lib/middleware/guest-auth";
import { persistDiagramShadow } from "@/lib/diagrams/shadow-persist";
import { normalizeArtifacts } from "@/lib/metasop/utils/normalize-artifacts";

export type GenerationJobStatus = "pending" | "running" | "completed" | "failed";

export interface GenerationJob {
  id: string;
  userId: string;
  diagramId: string;
  status: GenerationJobStatus;
  createdAt: string;
  updatedAt: string;
  error?: string;
  events: MetaSOPEvent[];
  emitter: EventEmitter;
  /**
   * True when this in-memory job is owned by the current worker/process.
   * In Next.js dev, route handlers may run in multiple workers; a reconstructed
   * job (loaded from disk) should tail the event log instead of relying on the
   * in-memory EventEmitter.
   */
  local?: boolean;
}

export interface StartJobParams {
  jobId: string;
  userId: string;
  diagramId: string;
  prompt: string;
  options?: {
    includeStateManagement?: boolean;
    includeAPIs?: boolean;
    includeDatabase?: boolean;
    model?: string;
    reasoning?: boolean;
  };
  documents?: Array<{ name: string; type: string; content: string }>;
  clarificationAnswers?: Record<string, string>;
  guestSessionId?: string;
}

const jobs = new Map<string, GenerationJob>();
const JOB_TTL_MS = 1000 * 60 * 30;
const DISK_CLEANUP_DELAY_MS = 1000 * 60 * 2;

function getJobsDir(): string {
  return path.join(process.cwd(), ".tmp", "generation_jobs");
}

function getJobFilePath(jobId: string): string {
  return path.join(getJobsDir(), `${jobId}.json`);
}

function getJobEventsFilePath(jobId: string): string {
  return path.join(getJobsDir(), `${jobId}.events.ndjson`);
}

function nowIso(): string {
  return new Date().toISOString();
}

function scheduleCleanup(jobId: string): void {
  setTimeout(() => {
    jobs.delete(jobId);
  }, JOB_TTL_MS);
}

function scheduleDiskCleanup(jobId: string): void {
  // In Next.js dev multi-worker mode, the SSE route may tail the NDJSON file.
  // Deleting immediately on completion can cause the tailer to miss the final
  // step_complete/orchestration_complete events.
  setTimeout(() => {
    try {
      const filePath = getJobFilePath(jobId);
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      const eventsPath = getJobEventsFilePath(jobId);
      if (fs.existsSync(eventsPath)) fs.unlinkSync(eventsPath);
    } catch {
      // ignore
    }
  }, DISK_CLEANUP_DELAY_MS);
}

export function createGenerationJob(userId: string, diagramId: string): GenerationJob {
  const jobId = randomUUID();
  const job: GenerationJob = {
    id: jobId,
    userId,
    diagramId,
    status: "pending",
    createdAt: nowIso(),
    updatedAt: nowIso(),
    events: [],
    emitter: new EventEmitter(),
    local: true,
  };
  jobs.set(jobId, job);
  // Persist a lightweight job file so other dev worker instances can discover it
  try {
    const dir = getJobsDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(getJobFilePath(jobId), JSON.stringify({ id: jobId, userId, diagramId, status: job.status, createdAt: job.createdAt }));
    // Create/clear the event log for this job (NDJSON)
    fs.writeFileSync(getJobEventsFilePath(jobId), "");
  } catch (_e) {
    // ignore persistence errors in dev
  }
  scheduleCleanup(jobId);
  return job;
}

export function getGenerationJob(jobId: string): GenerationJob | undefined {
  const job = jobs.get(jobId);
  if (job) return job;

  // Fallback: try to load job file persisted to disk (helps in dev with multiple workers)
  try {
    const filePath = getJobFilePath(jobId);
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf-8");
      const parsed = JSON.parse(raw);
      const reconstructed: GenerationJob = {
        id: parsed.id,
        userId: parsed.userId,
        diagramId: parsed.diagramId,
        status: parsed.status || "pending",
        createdAt: parsed.createdAt || nowIso(),
        updatedAt: parsed.updatedAt || nowIso(),
        events: [],
        emitter: new EventEmitter(),
        local: false,
      };
      // store in memory for future calls
      jobs.set(jobId, reconstructed);
      scheduleCleanup(jobId);
      return reconstructed;
    }
  } catch (_e) {
    // ignore read errors
  }

  return undefined;
}

function tailJobEvents(
  jobId: string,
  onEvent: (event: MetaSOPEvent) => void
): { stop: () => void } | null {
  const eventsFilePath = getJobEventsFilePath(jobId);
  if (!fs.existsSync(eventsFilePath)) return null;

  let offset = 0;
  let remainder = "";

  const readNew = () => {
    try {
      const stat = fs.statSync(eventsFilePath);
      if (stat.size <= offset) return;

      const fd = fs.openSync(eventsFilePath, "r");
      try {
        const length = stat.size - offset;
        const buf = Buffer.allocUnsafe(length);
        fs.readSync(fd, buf, 0, length, offset);
        offset = stat.size;

        const text = remainder + buf.toString("utf-8");
        const lines = text.split("\n");
        remainder = lines.pop() || "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try {
            const ev = JSON.parse(trimmed) as MetaSOPEvent;
            onEvent(ev);
          } catch {
            // ignore malformed line
          }
        }
      } finally {
        fs.closeSync(fd);
      }
    } catch {
      // ignore file errors
    }
  };

  // Replay existing events immediately
  readNew();

  const interval = setInterval(readNew, 250);
  return {
    stop: () => {
      clearInterval(interval);
    },
  };
}

export function subscribeToJob(jobId: string, onEvent: (event: MetaSOPEvent) => void): (() => void) | null {
  const job = jobs.get(jobId);
  if (!job) return null;

  // Local jobs can rely on the in-memory event emitter.
  if (job.local) {
    job.events.forEach(onEvent);
    const listener = (event: MetaSOPEvent) => onEvent(event);
    job.emitter.on("event", listener);
    return () => {
      job.emitter.off("event", listener);
    };
  }

  // Reconstructed jobs (other dev worker) tail the persisted event log.
  const tailer = tailJobEvents(jobId, onEvent);
  if (!tailer) {
    // Fallback to in-memory if no file exists
    job.events.forEach(onEvent);
    const listener = (event: MetaSOPEvent) => onEvent(event);
    job.emitter.on("event", listener);
    return () => {
      job.emitter.off("event", listener);
    };
  }

  return () => {
    tailer.stop();
  };
}

function appendEvent(job: GenerationJob, event: MetaSOPEvent): void {
  job.events.push(event);
  job.updatedAt = nowIso();
  job.emitter.emit("event", event);

  // Persist event for cross-worker SSE streaming in dev
  try {
    const dir = getJobsDir();
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.appendFileSync(getJobEventsFilePath(job.id), `${JSON.stringify(event)}\n`);
  } catch {
    // ignore persistence errors
  }
}

export function startGenerationJob(params: StartJobParams): void {
  const job = jobs.get(params.jobId);
  if (!job) return;

  job.status = "running";
  job.updatedAt = nowIso();

  const run = async () => {
    try {
      const dbHealth = await checkDatabaseHealth();
      if (!dbHealth.healthy) {
        const errorMessage = `Database unavailable: ${dbHealth.error ?? "connection failed"}`;
        await diagramDb.updateStatus(params.diagramId, "failed", errorMessage);
        appendEvent(job, {
          type: "orchestration_failed",
          error: errorMessage,
          timestamp: nowIso(),
        });
        job.status = "failed";
        job.error = errorMessage;
        return;
      }

      const orchestrationResult = await runMetaSOPOrchestration(
        params.prompt,
        params.options,
        (event) => appendEvent(job, event),
        params.documents,
        params.clarificationAnswers
      );

      if (!orchestrationResult.success) {
        const errorMessage = orchestrationResult.steps.find((s) => s.error)?.error || "Orchestration failed";
        await diagramDb.updateStatus(params.diagramId, "failed", errorMessage);
        appendEvent(job, {
          type: "orchestration_failed",
          error: errorMessage,
          timestamp: nowIso(),
        });
        job.status = "failed";
        job.error = errorMessage;
        return;
      }

      const pmArtifact = orchestrationResult.artifacts.pm_spec?.content;
      const title =
        (pmArtifact && "project_name" in pmArtifact ? (pmArtifact as { project_name?: string }).project_name : undefined) ||
        params.prompt.split("\n")[0].substring(0, 50) ||
        "New Diagram";
      const description =
        (pmArtifact && "summary" in pmArtifact ? (pmArtifact as { summary?: string }).summary : undefined) ||
        params.prompt.substring(0, 200) ||
        "";

      const normalizedArtifacts = normalizeArtifacts(orchestrationResult.artifacts);

      const savedDiagram = await diagramDb.update(params.diagramId, params.userId, {
        title,
        description,
        status: "completed",
        metadata: {
          prompt: params.prompt,
          options: params.options,
          metasop_artifacts: normalizedArtifacts,
          metasop_report: orchestrationResult.report,
          metasop_steps: orchestrationResult.steps,
          generated_at: nowIso(),
        },
      });

      if (params.guestSessionId) {
        recordGuestDiagramCreation(params.guestSessionId);
      }

      persistDiagramShadow(savedDiagram);

      appendEvent(job, {
        type: "orchestration_complete",
        timestamp: nowIso(),
        diagram: {
          id: savedDiagram.id,
          title: savedDiagram.title,
          description: savedDiagram.description,
          metadata: savedDiagram.metadata,
        },
      } as MetaSOPEvent);

      job.status = "completed";

      // Delay cleanup so SSE tailers in other dev workers can read final events.
      scheduleDiskCleanup(job.id);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Generation failed";
      try {
        await diagramDb.updateStatus(params.diagramId, "failed", message);
      } catch {
        // ignore db update errors
      }
      appendEvent(job, {
        type: "orchestration_failed",
        error: message,
        timestamp: nowIso(),
      });
      job.status = "failed";

      // Delay cleanup so SSE tailers can still read the failure event.
      scheduleDiskCleanup(job.id);
      job.error = message;
    }
  };

  run();
}
