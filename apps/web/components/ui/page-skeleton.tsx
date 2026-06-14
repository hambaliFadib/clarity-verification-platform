export function PageSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <div className="h-4 w-4 bg-surface-container-high rounded-full animate-pulse" />
        <div className="h-4 w-32 bg-surface-container-high rounded animate-pulse" />
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-start">
        <div className="space-y-3 w-full max-w-lg">
          <div className="h-10 w-full bg-surface-container-high rounded-lg animate-pulse" />
          <div className="flex gap-2">
            <div className="h-6 w-20 bg-surface-container-high rounded-full animate-pulse" />
            <div className="h-6 w-24 bg-surface-container-high rounded-full animate-pulse" />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="h-10 w-24 bg-surface-container-high rounded-lg animate-pulse" />
          <div className="h-10 w-32 bg-surface-container-high rounded-lg animate-pulse" />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        <div className="md:col-span-2 space-y-6">
          <div className="h-64 w-full bg-surface-container-high rounded-xl animate-pulse" />
          <div className="h-96 w-full bg-surface-container-high rounded-xl animate-pulse" />
        </div>
        <div className="space-y-6">
          <div className="h-48 w-full bg-surface-container-high rounded-xl animate-pulse" />
          <div className="h-64 w-full bg-surface-container-high rounded-xl animate-pulse" />
        </div>
      </div>
    </div>
  );
}
