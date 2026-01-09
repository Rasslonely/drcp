import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center">
      <Loader2 className="h-12 w-12 animate-spin text-indigo-400 mb-4" />
      <p className="text-gray-400 animate-pulse">Loading...</p>
    </div>
  );
}
