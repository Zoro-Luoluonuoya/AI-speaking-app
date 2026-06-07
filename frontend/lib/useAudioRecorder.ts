"use client";

import { useRef, useState, useCallback } from "react";

export type RecorderState = "idle" | "recording" | "stopped";

export function useAudioRecorder() {
  const mediaRecorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [state, setState] = useState<RecorderState>("idle");
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);

  const start = useCallback(async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const recorder = new MediaRecorder(stream, {
      mimeType: MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm",
    });

    chunks.current = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.current.push(e.data);
    };
    recorder.onstop = () => {
      const blob = new Blob(chunks.current, { type: recorder.mimeType });
      setAudioBlob(blob);
      setState("stopped");
      stream.getTracks().forEach((t) => t.stop());
    };

    mediaRecorder.current = recorder;
    recorder.start();
    setState("recording");
  }, []);

  const stop = useCallback(() => {
    if (mediaRecorder.current?.state === "recording") {
      mediaRecorder.current.stop();
    }
  }, []);

  const reset = useCallback(() => {
    setAudioBlob(null);
    setState("idle");
  }, []);

  return { state, audioBlob, start, stop, reset };
}
