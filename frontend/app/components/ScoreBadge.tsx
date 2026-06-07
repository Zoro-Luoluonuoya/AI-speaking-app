"use client";

interface Props {
  score: number;
  size?: number;
}

const COLORS = {
  excellent: "#059669",
  good: "#d97706",
  needs: "#dc2626",
  track: "#334155",
} as const;

const LABELS: Record<string, string> = {
  tooShort: "Too short",
  excellent: "Excellent",
  good: "Good",
  fair: "Fair",
  needs: "Needs work",
};

function scoreColor(score: number) {
  if (score >= 80) return COLORS.excellent;
  if (score >= 60) return COLORS.good;
  return COLORS.needs;
}

function scoreLabel(score: number) {
  if (score === 0) return LABELS.tooShort;
  if (score >= 80) return LABELS.excellent;
  if (score >= 60) return LABELS.good;
  if (score >= 40) return LABELS.fair;
  return LABELS.needs;
}

export default function ScoreBadge({ score, size = 36 }: Props) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = scoreColor(score);

  return (
    <div
      className="flex items-center gap-1.5"
      role="img"
      aria-label={`Pronunciation score: ${score} out of 100, ${scoreLabel(score)}`}
    >
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={COLORS.track}
            strokeWidth="3"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        <span
          className="absolute inset-0 flex items-center justify-center text-[10px] font-bold tabular-nums"
          style={{ color }}
        >
          {score}
        </span>
      </div>
      <div className="flex flex-col">
        <span className="text-[10px] font-semibold leading-tight" style={{ color }}>
          {scoreLabel(score)}
        </span>
      </div>
    </div>
  );
}
