"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { Eye, RefreshCw, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function TransparencyError({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error("Transparency error:", error);
  }, [error]);

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-md"
      >
        {/* Icon */}
        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-500/20 border border-indigo-500/30 mx-auto mb-6">
          <Eye className="h-10 w-10 text-indigo-400" />
        </div>

        {/* Message */}
        <h1 className="text-2xl font-bold text-white mb-2">
          Data Loading Error
        </h1>
        <p className="text-gray-400 text-sm mb-6">
          Unable to fetch on-chain transparency data. The subgraph or RPC might be temporarily unavailable.
        </p>

        {/* Note about data integrity */}
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 mb-6">
          <p className="text-sm text-emerald-400">
            💚 Your donations are safe! All data is stored immutably on the blockchain.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button
            variant="primary"
            className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600"
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
