"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Rocket,
  Shield,
  XCircle,
} from "lucide-react";

interface ReadinessResult {
  overall_score: number;
  status: "ready" | "conditional" | "not_ready";
  test_coverage: number;
  defect_summary: {
    total: number;
    open: number;
    critical: number;
    high: number;
  };
  risk_areas: string[];
  recommendations: string[];
  go_no_go: "go" | "no-go" | "conditional";
  confidence: number;
}

interface ReadinessAssessmentProps {
  releaseId: string;
  releaseName: string;
}

const statusConfig = {
  ready: { icon: CheckCircle2, color: "text-success", bg: "bg-green-50", label: "Ready to Release" },
  conditional: { icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50", label: "Conditional" },
  not_ready: { icon: XCircle, color: "text-error", bg: "bg-red-50", label: "Not Ready" },
};

export function ReadinessAssessment({ releaseId, releaseName }: ReadinessAssessmentProps) {
  const [result, setResult] = useState<ReadinessResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const assessReadiness = async () => {
    setIsLoading(true);
    try {
      window.setTimeout(() => {
        const mockResult: ReadinessResult = {
          overall_score: 85,
          status: "ready",
          test_coverage: 92,
          defect_summary: { total: 12, open: 3, critical: 0, high: 1 },
          risk_areas: ["Performance testing incomplete"],
          recommendations: ["Complete performance tests", "Resolve 1 high-priority defect"],
          go_no_go: "go",
          confidence: 88,
        };
        setResult(mockResult);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Assessment failed", error);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white border border-outline-variant rounded-xl p-6 shadow-subtle">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Rocket className="h-5 w-5 text-primary" />
          <h3 className="text-body-lg font-semibold">Release Readiness</h3>
        </div>
        <Button variant="outline" size="sm" onClick={assessReadiness} disabled={isLoading}>
          {isLoading ? (
            <RefreshCw className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Shield className="h-4 w-4 mr-1" /> Assess
            </>
          )}
        </Button>
      </div>

      {!result && !isLoading && (
        <div className="text-center py-6 text-outline">
          <Rocket className="h-10 w-10 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Click "Assess" to evaluate release readiness</p>
        </div>
      )}

      {result && !isLoading && (
        <div className="space-y-4">
          <div className={`p-4 rounded-lg ${statusConfig[result.status].bg}`}>
            <div className="flex items-center gap-3">
              {(() => {
                const Icon = statusConfig[result.status].icon;
                return <Icon className={`h-6 w-6 ${statusConfig[result.status].color}`} />;
              })()}
              <div>
                <div className={`font-semibold ${statusConfig[result.status].color}`}>
                  {statusConfig[result.status].label}
                </div>
                <div className="text-sm text-on-surface-variant">
                  Score: {result.overall_score}/100 - Confidence: {result.confidence}%
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-surface-container-low rounded-lg">
              <div className="text-xs text-outline mb-1">Test Coverage</div>
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-surface-container-high rounded-full overflow-hidden">
                  <div
                    className="h-full bg-success rounded-full"
                    style={{ width: `${result.test_coverage}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{result.test_coverage}%</span>
              </div>
            </div>
            <div className="p-3 bg-surface-container-low rounded-lg">
              <div className="text-xs text-outline mb-1">Open Defects</div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{result.defect_summary.open}</span>
                {result.defect_summary.critical > 0 && (
                  <Badge variant="failed" className="text-xs">
                    {result.defect_summary.critical} Critical
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {result.risk_areas.length > 0 && (
            <div>
              <div className="text-xs font-medium text-on-surface-variant mb-2">Risk Areas</div>
              <ul className="space-y-1">
                {result.risk_areas.map((risk) => (
                  <li key={risk} className="text-sm text-on-surface-variant flex items-start gap-2">
                    <AlertTriangle className="h-3 w-3 text-orange-500 mt-1" />
                    {risk}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {result.recommendations.length > 0 && (
            <div>
              <div className="text-xs font-medium text-on-surface-variant mb-2">Recommendations</div>
              <ul className="space-y-1">
                {result.recommendations.map((recommendation) => (
                  <li key={recommendation} className="text-sm text-on-surface-variant flex items-start gap-2">
                    <CheckCircle2 className="h-3 w-3 text-success mt-1" />
                    {recommendation}
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
