"use client";

interface QualityScoreProps {
  score: number;
}

export function QualityScore({ score }: QualityScoreProps) {
  const getColor = (s: number) => {
    if (s >= 80) return "text-success";
    if (s >= 60) return "text-primary";
    if (s >= 40) return "text-orange-500";
    return "text-error";
  };

  const getLabel = (s: number) => {
    if (s >= 80) return "Excellent";
    if (s >= 60) return "Good";
    if (s >= 40) return "Average";
    return "Needs Improvement";
  };

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle">
      <h3 className="text-body-lg font-semibold mb-4">Overall Quality Score</h3>
      <div className="flex flex-col items-center">
        <div className="relative">
          <svg className="h-32 w-32" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-container-low" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray={`${score * 2.83} 283`} strokeLinecap="round" className={getColor(score)} transform="rotate(-90 50 50)" />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-3xl font-bold ${getColor(score)}`}>{score}</span>
            <span className="text-xs text-outline">/ 100</span>
          </div>
        </div>
        <span className={`mt-2 font-medium ${getColor(score)}`}>{getLabel(score)}</span>
      </div>
    </div>
  );
}
