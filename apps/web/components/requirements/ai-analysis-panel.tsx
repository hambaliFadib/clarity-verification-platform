"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  AlertTriangle,
  AlertCircle,
  Lightbulb,
  RefreshCw,
} from "lucide-react";

interface AIAnalysis {
  completeness_score: number;
  ambiguities: string[];
  risks: string[];
  recommendations: string[];
  summary: string;
}

interface AIAnalysisPanelProps {
  requirementId: string;
  title: string;
  description?: string;
  acceptanceCriteria?: string;
  businessRules?: string;
  module?: string;
  type?: string;
  priority?: string;
}

function getScoreColor(score: number): string {
  if (score >= 90) return "text-success";
  if (score >= 70) return "text-primary";
  if (score >= 50) return "text-orange-500";
  return "text-error";
}

function getScoreLabel(score: number): string {
  if (score >= 90) return "Excellent";
  if (score >= 70) return "Good";
  if (score >= 50) return "Average";
  return "Needs Work";
}

export function AIAnalysisPanel({
  requirementId,
  title,
  description,
  acceptanceCriteria,
  businessRules,
  module,
  type,
  priority,
}: AIAnalysisPanelProps) {
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasAnalyzed, setHasAnalyzed] = useState(false);

  const handleAnalyze = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/ai/analyze-requirement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          acceptance_criteria: acceptanceCriteria,
          business_rules: businessRules,
          module,
          type,
          priority,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        setAnalysis(result);
        setHasAnalyzed(true);
        toast.success("AI analysis completed!");
      } else {
        throw new Error("Analysis failed");
      }
    } catch (error) {
      toast.error("Failed to run AI analysis");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="text-body-lg font-semibold">AI Analysis</h3>
        </div>
        <Button
          variant="outline"
          onClick={handleAnalyze}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> Analyzing...
            </>
          ) : hasAnalyzed ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2" /> Re-analyze
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" /> Analyze
            </>
          )}
        </Button>
      </div>

      {!hasAnalyzed && !isLoading && (
        <div className="text-center py-8 text-outline">
          <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Click "Analyze" to get AI-powered insights</p>
        </div>
      )}

      {isLoading && (
        <div className="space-y-4 animate-pulse">
          <div className="flex justify-center">
            <div className="h-24 w-24 rounded-full bg-surface-container-low" />
          </div>
          <div className="h-4 bg-surface-container-low rounded w-3/4 mx-auto" />
          <div className="h-4 bg-surface-container-low rounded w-1/2 mx-auto" />
        </div>
      )}

      {analysis && !isLoading && (
        <div className="space-y-6">
          {/* Score Circle */}
          <div className="flex flex-col items-center">
            <div className="relative">
              <svg className="h-28 w-28" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  className="text-surface-container-low"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="45"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="8"
                  strokeDasharray={`${analysis.completeness_score * 2.83} 283`}
                  strokeLinecap="round"
                  className={getScoreColor(analysis.completeness_score)}
                  transform="rotate(-90 50 50)"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-2xl font-bold ${getScoreColor(analysis.completeness_score)}`}>
                  {analysis.completeness_score}
                </span>
                <span className="text-xs text-outline">/ 100</span>
              </div>
            </div>
            <Badge 
              variant={analysis.completeness_score >= 70 ? "success" : "failed"}
              className="mt-2"
            >
              {getScoreLabel(analysis.completeness_score)}
            </Badge>
          </div>

          {/* Summary */}
          <p className="text-sm text-on-surface-variant text-center">
            {analysis.summary}
          </p>

          {/* Ambiguities */}
          {analysis.ambiguities.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-orange-500">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium text-sm">Ambiguities ({analysis.ambiguities.length})</span>
              </div>
              <ul className="space-y-1">
                {analysis.ambiguities.map((item, i) => (
                  <li key={i} className="text-sm text-on-surface-variant pl-6 flex items-start gap-2">
                    <span className="text-orange-500 mt-1">&bull;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Risks */}
          {analysis.risks.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-error">
                <AlertCircle className="h-4 w-4" />
                <span className="font-medium text-sm">Risks ({analysis.risks.length})</span>
              </div>
              <ul className="space-y-1">
                {analysis.risks.map((item, i) => (
                  <li key={i} className="text-sm text-on-surface-variant pl-6 flex items-start gap-2">
                    <span className="text-error mt-1">&bull;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-success">
                <Lightbulb className="h-4 w-4" />
                <span className="font-medium text-sm">Recommendations ({analysis.recommendations.length})</span>
              </div>
              <ul className="space-y-1">
                {analysis.recommendations.map((item, i) => (
                  <li key={i} className="text-sm text-on-surface-variant pl-6 flex items-start gap-2">
                    <span className="text-success mt-1">&bull;</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
