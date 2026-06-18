"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { useEffect, useState } from "react";

export function CompliancePanel() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/compliance/report")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => console.error(e));
  }, []);

  if (!data) return <Card><CardContent className="p-6 text-center text-muted-foreground">Loading compliance...</CardContent></Card>;

  const isCompliant = data.compliance_score >= 80;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          {isCompliant ? <ShieldCheck className="h-5 w-5 text-green-500" /> : <ShieldAlert className="h-5 w-5 text-amber-500" />}
          Compliance Tracking
        </CardTitle>
        <span className="font-bold text-lg">{data.compliance_score}%</span>
      </CardHeader>
      <CardContent>
        <Progress value={data.compliance_score} className="h-2 mb-4" />

        <div className="space-y-3">
          {data.items?.map((item: any) => (
            <div key={item.id} className="flex items-start gap-3 text-sm border-b pb-2 last:border-0 last:pb-0">
              {item.status === "compliant" ? (
                <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 text-amber-500 mt-0.5" />
              )}
              <div className="flex-1">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-muted-foreground">Category: {item.category}</p>
                {item.remediation && (
                  <p className="text-xs text-amber-600 mt-1 bg-amber-50 p-1 rounded">Fix: {item.remediation}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
