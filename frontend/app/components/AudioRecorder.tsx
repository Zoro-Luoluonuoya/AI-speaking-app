"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAudioRecorder } from "@/lib/useAudioRecorder";

interface Props {
  onTranscription: (text: string, confidence: number) => void;
  disabled?: boolean;
}

export default function AudioRecorder({ onTranscription, disabled }: Props) {
  const { state, audioBlob, start, stop, reset } = useAudioRecorder();
  const sendingRef = useRef(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (state !== "stopped" || !audioBlob || sendingRef.current) return;
    sendingRef.current = true;

    const form = new FormData();
    form.append("file", audioBlob, "recording.webm");

    fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001"}/api/transcribe`, {
      method: "POST",
      body: form,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.text) onTranscription(data.text, data.confidence ?? 85);
      })
      .catch(console.error)
      .finally(() => {
        sendingRef.current = false;
        reset();
      });
  }, [state, audioBlob, onTranscription, reset]);

  // Use native addEventListener for touchstart/touchend to avoid passive listener issue
  useEffect(() => {
    const el = buttonRef.current;
    if (!el) return;

    const onTouchStart = (e: Event) => {
      e.stopPropagation();
      if (!disabled) start();
    };
    const onTouchEnd = () => stop();

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [disabled, start, stop]);

  const isRecording = state === "recording";

  return (
    <button
      ref={buttonRef}
      onMouseDown={() => !disabled && start()}
      onMouseUp={stop}
      disabled={disabled || state === "stopped"}
      className={`
        w-16 h-16 rounded-full flex items-center justify-center
        transition-all duration-200 select-none touch-none
        ${isRecording
          ? "bg-red-500 scale-110 recording-ring"
          : "bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 shadow-md"
        }
        disabled:opacity-40 disabled:cursor-not-allowed
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2
      `}
      aria-label={isRecording ? "Recording..." : "Hold to record"}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="white"
        className="w-7 h-7 pointer-events-none"
      >
        <path d="M12 1a4 4 0 0 0-4 4v6a4 4 0 0 0 8 0V5a4 4 0 0 0-4-4Z" />
        <path d="M19 11a1 1 0 1 0-2 0 5 5 0 0 1-10 0 1 1 0 1 0-2 0 7 7 0 0 0 6 6.93V20H8a1 1 0 1 0 0 2h8a1 1 0 1 0 0-2h-3v-2.07A7 7 0 0 0 19 11Z" />
      </svg>
    </button>
  );
}
