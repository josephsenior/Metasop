"use client";

import React, { useState, useRef } from "react";
import { Mic, Loader2, StopCircle } from "lucide-react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useToast } from "./use-toast";

interface VoiceInputButtonProps {
  onTranscription: (text: string) => void;
  disabled?: boolean;
  className?: string;
  variant?: "ghost" | "outline" | "default";
  size?: "icon" | "sm" | "default";
}

export function VoiceInputButton({
  onTranscription,
  disabled,
  className,
  variant = "ghost",
  size = "icon",
}: VoiceInputButtonProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        await handleTranscription(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      toast({
        title: "Microphone Error",
        description: "Could not access your microphone. Please check your browser permissions.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const handleTranscription = async (blob: Blob) => {
    setIsTranscribing(true);
    try {
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        const base64Audio = reader.result?.toString().split(",")[1];
        if (!base64Audio) {
          setIsTranscribing(false);
          return;
        }

        try {
          const response = await fetch("/api/voice/transcribe", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ audio: base64Audio, mimeType: "audio/webm" }),
          });

          if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || "Transcription failed");
          }

          const data = await response.json();
          if (data.text) {
            onTranscription(data.text);
          } else {
            toast({
              title: "No speech detected",
              description: "We couldn't hear any speech in the recording.",
            });
          }
        } catch (err: any) {
          console.error("Transcription error:", err);
          toast({
            title: "Transcription Failed",
            description: err.message || "Failed to transcribe audio. Please try again.",
            variant: "destructive",
          });
        } finally {
          setIsTranscribing(false);
        }
      };
    } catch (err: any) {
      console.error("FileReader error:", err);
      setIsTranscribing(false);
    }
  };

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      disabled={disabled || isTranscribing}
      onClick={isRecording ? stopRecording : startRecording}
      className={cn(
        "relative transition-all duration-200",
        isRecording && "text-red-500 animate-pulse hover:text-red-600 bg-red-50 dark:bg-red-900/20",
        isTranscribing && "text-blue-500",
        className
      )}
      title={isRecording ? "Stop Recording" : "Start Voice Input"}
    >
      {isTranscribing ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isRecording ? (
        <StopCircle className="h-4 w-4" />
      ) : (
        <Mic className="h-4 w-4" />
      )}
      {isRecording && (
        <span className="absolute -top-1 -right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}
    </Button>
  );
}
