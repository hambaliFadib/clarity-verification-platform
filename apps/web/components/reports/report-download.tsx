"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { useState } from "react";

export function ReportDownload() {
  const [loading, setLoading] = useState(false);

  const downloadReport = async (type: string) => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, format: "excel" }),
      });

      if (!res.ok) throw new Error("Failed to generate report");

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `nexqa_${type}_report.xlsx`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Failed to download report");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Reports
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          <Button 
            variant="outline" 
            className="w-full justify-start text-xs h-9" 
            onClick={() => downloadReport("quality")}
            disabled={loading}
          >
            Quality Metrics
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start text-xs h-9" 
            onClick={() => downloadReport("requirements")}
            disabled={loading}
          >
            Requirements
          </Button>
          <Button 
            variant="outline" 
            className="w-full justify-start text-xs h-9" 
            onClick={() => downloadReport("defects")}
            disabled={loading}
          >
            Defects Log
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
