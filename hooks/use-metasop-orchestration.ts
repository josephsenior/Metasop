"use client"

import { useState, useEffect, useCallback, useRef } from "react";
import { metasopApi, type MetaSOPOrchestrationData } from "@/lib/api/metasop";

export interface OrchestrationStep {
  step_id: string;
  role: string;
  status: "pending" | "running" | "success" | "failed";
  artifact?: any;
  artifact_hash?: string;
  error?: string;
  timestamp?: string;
}

export function useMetaSOPOrchestration(diagramId?: string) {
  const [steps, setSteps] = useState<OrchestrationStep[]>([]);
  const [isOrchestrating, setIsOrchestrating] = useState(false);
  const [orchestrationData, setOrchestrationData] = useState<MetaSOPOrchestrationData | null>(null);
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStepIdRef = useRef<string | undefined>(undefined);

  // Poll for updates if diagramId is provided
  useEffect(() => {
    if (!diagramId) {
      return;
    }

    const pollForUpdates = async () => {
      try {
        const data = await metasopApi.pollOrchestration(diagramId, lastStepIdRef.current);
        setOrchestrationData(data);

        // Update steps from orchestration data
        if (data.steps) {
          setSteps(data.steps);
          setIsOrchestrating(data.status === "processing");

          // Update last step ID
          if (data.steps.length > 0) {
            const lastStep = data.steps[data.steps.length - 1];
            lastStepIdRef.current = lastStep.step_id;
          }
        }

        // Stop polling if orchestration is complete
        if (data.status === "success" || data.status === "failed") {
          setIsOrchestrating(false);
          if (pollingIntervalRef.current) {
            clearInterval(pollingIntervalRef.current);
            pollingIntervalRef.current = null;
          }
        }
      } catch (error: any) {
        // Only log non-401 errors (401 means user is not authenticated, which is expected)
        if (error?.response?.status !== 401) {
          console.error("Failed to poll orchestration:", error);
        }
      }
    };

    // Initial fetch
    pollForUpdates();

    // Poll every 2 seconds while orchestrating
    if (isOrchestrating) {
      pollingIntervalRef.current = setInterval(pollForUpdates, 2000);
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [diagramId, isOrchestrating]);

  // Load orchestration data if diagramId is provided
  useEffect(() => {
    if (!diagramId) {
      return;
    }

    const loadOrchestration = async () => {
      try {
        const data = await metasopApi.getOrchestrationStatus(diagramId);
        setOrchestrationData(data);

        if (data.steps) {
          setSteps(data.steps);
          setIsOrchestrating(data.status === "processing");
        }
      } catch (error: any) {
        // Only log non-401 errors (401 means user is not authenticated, which is expected)
        if (error?.response?.status !== 401) {
          console.error("Failed to load orchestration:", error);
        }
      }
    };

    loadOrchestration();
  }, [diagramId]);

  const clearSteps = useCallback(() => {
    setSteps([]);
    setIsOrchestrating(false);
    setOrchestrationData(null);
    lastStepIdRef.current = undefined;
  }, []);

  const updateSteps = useCallback((newSteps: OrchestrationStep[]) => {
    setSteps(newSteps);
  }, []);

  return {
    steps,
    isOrchestrating,
    clearSteps,
    hasSteps: steps.length > 0,
    orchestrationData,
    updateSteps,
  };
}

