import { Bell, HelpCircle, Shield } from "lucide-react";

export function TopNav() {
  return (
    <header className="flex justify-between items-center h-14 px-gutter w-full sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-outline-variant">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-gradient-to-br from-primary-container to-primary rounded-lg flex items-center justify-center">
          <Shield className="h-4 w-4 text-white" />
        </div>
        <span className="text-headline-sm font-headline font-bold text-on-surface">
          NexQA
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="relative p-2 hover:bg-surface-container-high transition-colors rounded-full"
          aria-label="Notifications"
        >
          <Bell className="h-[18px] w-[18px] text-on-surface-variant" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-error rounded-full ring-2 ring-white" />
        </button>
        <button
          className="p-2 hover:bg-surface-container-high transition-colors rounded-full"
          aria-label="Help"
        >
          <HelpCircle className="h-[18px] w-[18px] text-on-surface-variant" />
        </button>

        <div className="flex items-center gap-3 pl-3 ml-1 border-l border-outline-variant">
          <div className="text-right">
            <p className="text-label-bold font-label-bold text-on-surface leading-tight">
              Hambali Fadib
            </p>
            <span className="text-[9px] bg-gradient-to-r from-primary-container to-primary text-white px-1.5 py-0.5 rounded font-bold uppercase tracking-normal">
              Admin
            </span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-fixed to-primary-fixed-dim flex items-center justify-center text-on-primary-fixed font-bold text-xs border-2 border-white shadow-subtle">
            HF
          </div>
        </div>
      </div>
    </header>
  );
}
