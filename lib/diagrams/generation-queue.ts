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
  documents?: any[];
  clarificationAnswers?: Record<string, string>;
  guestSessionId?: string;
}

const jobs = new Map<string, GenerationJob>();
const JOB_TTL_MS = 1000 * 60 * 30;

function nowIso(): string {
  return new Date().toISOString();
}

function scheduleCleanup(jobId: string): void {
  setTimeout(() => {
    jobs.delete(jobId);
  }, JOB_TTL_MS);
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
  };
  jobs.set(jobId, job);
  // Persist a lightweight job file so other dev worker instances can discover it
  try {
    const dir = path.join(process.cwd(), "tmp", "generation_jobs");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `${jobId}.json`);
    fs.writeFileSync(filePath, JSON.stringify({ id: jobId, userId, diagramId, status: job.status, createdAt: job.createdAt }));
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
    const filePath = path.join(process.cwd(), "tmp", "generation_jobs", `${jobId}.json`);
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

export function subscribeToJob(jobId: string, onEvent: (event: MetaSOPEvent) => void): (() => void) | null {
  const job = jobs.get(jobId);
  if (!job) return null;

  job.events.forEach(onEvent);
  const listener = (event: MetaSOPEvent) => onEvent(event);
  job.emitter.on("event", listener);

  return () => {
    job.emitter.off("event", listener);
  };
}

function appendEvent(job: GenerationJob, event: MetaSOPEvent): void {
  job.events.push(event);
  job.updatedAt = nowIso();
  job.emitter.emit("event", event);
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

      const pmArtifact = orchestrationResult.artifacts.pm_spec?.content as any;
      const title = pmArtifact?.project_name || params.prompt.split("\n")[0].substring(0, 50) || "New Diagram";
      const description = pmArtifact?.summary || params.prompt.substring(0, 200) || "";

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

      // Cleanup persisted job file
      try {
        const filePath = path.join(process.cwd(), "tmp", "generation_jobs", `${job.id}.json`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (_e) {
        // ignore
      }
    } catch (error: any) {
      const message = error?.message || "Generation failed";
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
      // Cleanup persisted job file on failure as well
      try {
        const filePath = path.join(process.cwd(), "tmp", "generation_jobs", `${job.id}.json`);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
      } catch (_e) {
        // ignore
      }
      job.error = message;
    }
  };

  run();
}
