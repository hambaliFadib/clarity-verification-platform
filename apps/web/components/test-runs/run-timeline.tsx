"use client";

import { Play, CheckCircle2, XCircle } from "lucide-react";

export function RunTimeline() {
  return (
    <div className="space-y-4 text-body-sm relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant before:to-transparent">
      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-surface-container-low text-on-surface-variant shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
          <Play className="w-4 h-4" />
        </div>
        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-outline-variant bg-white shadow-subtle">
          <div className="flex items-center justify-between mb-1">
            <div className="font-bold text-on-surface">Run started</div>
            <time className="text-xs font-medium text-outline">10:00:00</time>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-success/20 text-success shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
          <CheckCircle2 className="h-4 w-4" />
        </div>
        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-outline-variant bg-white shadow-subtle">
          <div className="flex items-center justify-between mb-1">
            <div className="font-bold text-on-surface">TC-001 Passed</div>
            <time className="text-xs font-medium text-outline">10:00:12</time>
          </div>
        </div>
      </div>

      <div className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
        <div className="flex items-center justify-center w-10 h-10 rounded-full border border-white bg-error/20 text-error shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
          <XCircle className="h-4 w-4" />
        </div>
        <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border border-error/50 bg-error/5 shadow-subtle">
          <div className="flex items-center justify-between mb-1">
            <div className="font-bold text-error">TC-003 Failed</div>
            <time className="text-xs font-medium text-error">10:00:35</time>
          </div>
        </div>
      </div>
    </div>
  );
}
