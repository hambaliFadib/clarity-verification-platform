"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Image,
  FileText,
  Activity,
  Upload,
  Download,
  ExternalLink,
} from "lucide-react";

interface Evidence {
  id: string;
  type: "Screenshot" | "Video" | "Log" | "API_Response" | "Performance";
  fileUrl: string;
  details?: Record<string, any>;
  createdAt: string;
}

interface EvidenceViewerProps {
  runId: string;
}

const evidenceTypeConfig: Record<string, { icon: typeof Image; color: string }> = {
  Screenshot: { icon: Image, color: "text-primary" },
  Video: { icon: FileText, color: "text-purple-500" },
  Log: { icon: FileText, color: "text-orange-500" },
  API_Response: { icon: Activity, color: "text-green-500" },
  Performance: { icon: Activity, color: "text-blue-500" },
};

export function EvidenceViewer({ runId }: EvidenceViewerProps) {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterType, setFilterType] = useState<string | null>(null);

  useEffect(() => {
    fetchEvidence();
  }, [runId]);

  const fetchEvidence = async () => {
    try {
      const response = await fetch(`/api/test-runs/${runId}/evidence`);
      if (response.ok) {
        setEvidence(await response.json());
      }
    } catch (error) {
      console.error("Failed to fetch evidence", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredEvidence = filterType
    ? evidence.filter((e) => e.type === filterType)
    : evidence;

  const groupedByType = evidence.reduce((acc, e) => {
    acc[e.type] = (acc[e.type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (isLoading) {
    return <div className="animate-pulse h-32 bg-surface-container-low rounded-lg" />;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-body-lg font-semibold">Evidence ({evidence.length})</h3>
        <Button variant="outline" size="sm">
          <Upload className="h-4 w-4 mr-2" /> Upload
        </Button>
      </div>

      {/* Filter by type */}
      <div className="flex flex-wrap gap-2">
        <Button
          variant={filterType === null ? "default" : "outline"}
          size="sm"
          onClick={() => setFilterType(null)}
        >
          All ({evidence.length})
        </Button>
        {Object.entries(groupedByType).map(([type, count]) => {
          const config = evidenceTypeConfig[type] || { icon: FileText, color: "text-outline" };
          const Icon = config.icon;
          return (
            <Button
              key={type}
              variant={filterType === type ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterType(type)}
            >
              <Icon className={`h-4 w-4 mr-1 ${config.color}`} />
              {type} ({count})
            </Button>
          );
        })}
      </div>

      {/* Evidence list */}
      <div className="space-y-3">
        {filteredEvidence.length === 0 ? (
          <p className="text-center text-outline py-8">No evidence found</p>
        ) : (
          filteredEvidence.map((item) => {
            const config = evidenceTypeConfig[item.type] || { icon: FileText, color: "text-outline" };
            const Icon = config.icon;
            return (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 border border-outline-variant rounded-lg hover:bg-surface-container-low"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-surface-container-low ${config.color}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-medium text-sm">{item.type}</div>
                    <div className="text-xs text-outline">
                      {new Date(item.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-8 items-center justify-center rounded px-3 text-on-surface-variant transition-colors hover:bg-surface-container-low"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
