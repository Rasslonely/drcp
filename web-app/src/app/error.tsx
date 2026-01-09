"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console (could integrate with error tracking service)
    console.error("Application error:", error);
  }, [error]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg"
      >
        {/* Error Icon */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="relative mb-8"
        >
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-red-500/20 border border-red-500/30 mx-auto">
            <AlertTriangle className="h-12 w-12 text-red-400" />
          </div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Something Went Wrong
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            An unexpected error occurred. Don&apos;t worry, your funds are safe on the blockchain.
          </p>
        </motion.div>

        {/* Error Details (optional, for debugging) */}
        {process.env.NODE_ENV === "development" && error.message && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-left"
          >
            <div className="flex items-center gap-2 text-red-400 text-sm font-medium mb-2">
              <Bug className="h-4 w-4" />
              Error Details (Dev Mode)
            </div>
            <p className="text-xs text-gray-400 font-mono break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="text-xs text-gray-500 mt-2">
                Digest: {error.digest}
              </p>
            )}
          </motion.div>
        )}

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Button
            variant="primary"
            className="w-full sm:w-auto bg-gradient-to-r from-red-500 to-orange-600 hover:from-red-600 hover:to-orange-700"
            onClick={reset}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Try Again
          </Button>
          <Link href="/">
            <Button variant="secondary" className="w-full sm:w-auto">
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </motion.div>

        {/* Help Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 text-xs text-gray-500"
        >
          If this problem persists, please try refreshing the page or{" "}
          <a href="https://github.com" className="text-indigo-400 hover:text-indigo-300">
            report an issue
          </a>
          .
        </motion.p>
      </motion.div>
    </div>
  );
}
