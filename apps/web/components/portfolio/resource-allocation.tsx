"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users } from "lucide-react";
import { useEffect, useState } from "react";

export function ResourceAllocation() {
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    fetch("/api/resources/workload")
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch((e) => console.error(e));
  }, []);

  if (!data) return <Card><CardContent className="p-6 text-center text-muted-foreground">Loading resources...</CardContent></Card>;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-bold flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-500" />
          Resource Allocation
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-muted-foreground">Overall Utilization</span>
            <span className="font-medium">{data.overall_utilization}%</span>
          </div>
          <Progress value={data.overall_utilization} className="h-2" />
        </div>

        <div className="space-y-3">
          {data.team_members?.map((member: any) => (
            <div key={member.user_id} className="text-sm">
              <div className="flex justify-between mb-1">
                <span className="font-medium">{member.name} <span className="text-muted-foreground font-normal">({member.role})</span></span>
                <span className={member.utilization > 100 ? "text-destructive font-bold" : "text-muted-foreground"}>
                  {member.utilization}%
                </span>
              </div>
              <Progress 
                value={Math.min(member.utilization, 100)} 
                className={`h-1.5 ${member.utilization > 100 ? "[&>div]:bg-destructive" : ""}`} 
              />
            </div>
          ))}
        </div>

        {data.recommendations?.length > 0 && (
          <div className="mt-4 p-3 bg-blue-50 rounded-md">
            <p className="text-xs font-semibold text-blue-800 mb-1">AI Recommendation</p>
            <ul className="text-xs text-blue-700 list-disc pl-4">
              {data.recommendations.map((rec: string, i: number) => (
                <li key={i}>{rec}</li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
