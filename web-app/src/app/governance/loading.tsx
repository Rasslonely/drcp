import { Skeleton } from "@/components/ui/skeleton";

export default function GovernanceLoading() {
  return (
    <div className="space-y-8">
      {/* Header Skeleton */}
      <div className="py-6 space-y-4">
        <Skeleton className="h-4 w-32" />
        <div className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid gap-4 md:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className="rounded-2xl border border-white/10 bg-white/5 p-4 flex items-center justify-center space-x-3"
          >
            <Skeleton className="h-6 w-6 rounded" />
            <div className="text-center">
              <Skeleton className="h-7 w-12 mb-1" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>

      {/* Delegation Panel Skeleton */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5">
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-32" />
          </div>
          <div className="text-right">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>

      {/* Proposals List Skeleton */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-32" />
        </div>
        {[1, 2, 3].map((i) => (
          <div 
            key={i} 
            className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-full max-w-md" />
              </div>
              <Skeleton className="h-6 w-16 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-3 w-full rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
