"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Vote, RefreshCw, ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GovernanceError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Governance error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-purple-500/20 border border-purple-500/30 mx-auto mb-6">
          <Vote className="h-10 w-10 text-purple-400" />
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-white mb-2">
          Governance Error
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Failed to load governance data. This might be a temporary issue with the blockchain connection.
        </p>

        {/* Suggestions */}
        <div className="bg-white/5 rounded-xl p-4 mb-6 text-left">
          <p className="text-sm text-gray-400 mb-2">Things to try:</p>
          <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside">
            <li>Check your wallet connection</li>
            <li>Switch to a different RPC endpoint</li>
            <li>Refresh the page</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-indigo-600"
            onClick={reset}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
          <Link href="/dashboard">
            <Button variant="secondary" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
