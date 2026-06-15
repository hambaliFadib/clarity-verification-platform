"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Bug, CheckCircle } from "lucide-react";

export function ProjectCard({ project }: { project: any }) {
  const isHealthy = project.quality_score >= 80;
  const isAtRisk = project.quality_score < 70;

  return (
    <Card className="hover:border-primary/50 transition-colors">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-bold">
          {project.name}
          <span className="ml-2 text-xs text-muted-foreground font-normal">
            ({project.prefix})
          </span>
        </CardTitle>
        <Badge variant={isHealthy ? "success" : isAtRisk ? "critical" : "medium" as any}>
          {isHealthy ? "Healthy" : isAtRisk ? "At Risk" : "Stable"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-muted-foreground">Quality Score</span>
              <span className="font-medium">{project.quality_score}/100</span>
            </div>
            <Progress value={project.quality_score} className="h-2" />
          </div>

          <div className="grid grid-cols-3 gap-4 pt-2">
            <div className="flex flex-col items-center p-2 bg-muted/50 rounded-md">
              <FileText className="h-4 w-4 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Reqs</span>
              <span className="font-semibold">{project.total_requirements}</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-muted/50 rounded-md">
              <CheckCircle className="h-4 w-4 text-muted-foreground mb-1" />
              <span className="text-xs text-muted-foreground">Tests</span>
              <span className="font-semibold">{project.total_test_cases}</span>
            </div>
            <div className="flex flex-col items-center p-2 bg-muted/50 rounded-md">
              <Bug className="h-4 w-4 text-destructive mb-1" />
              <span className="text-xs text-muted-foreground">Open Bugs</span>
              <span className="font-semibold">{project.open_defects}</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
