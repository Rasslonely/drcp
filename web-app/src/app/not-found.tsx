"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Home, ArrowLeft, Search, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-lg px-6"
      >
        {/* 404 Graphic */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
          className="relative mb-8"
        >
          <div className="text-[120px] md:text-[160px] font-bold leading-none bg-gradient-to-br from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent select-none">
            404
          </div>
          
          {/* Floating alert icon */}
          <motion.div
            animate={{ 
              y: [0, -8, 0],
              rotate: [-5, 5, -5]
            }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              ease: "easeInOut" 
            }}
            className="absolute top-4 right-4 md:right-8"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/20 border border-orange-500/30">
              <AlertTriangle className="h-6 w-6 text-orange-400" />
            </div>
          </motion.div>
        </motion.div>

        {/* Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Page Not Found
          </h1>
          <p className="text-gray-400 text-sm md:text-base">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            Let&apos;s get you back on track.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-3"
        >
          <Link href="/">
            <Button 
              variant="primary" 
              className="w-full sm:w-auto bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700"
            >
              <Home className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
          <Link href="/dashboard">
            <Button variant="secondary" className="w-full sm:w-auto">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Button>
          </Link>
        </motion.div>

        {/* Quick Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 pt-8 border-t border-white/10"
        >
          <p className="text-sm text-gray-500 mb-4">Quick Links</p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm">
            <Link 
              href="/transparency" 
              className="text-gray-400 hover:text-indigo-400 transition-colors"
            >
              Transparency
            </Link>
            <span className="text-gray-700">•</span>
            <Link 
              href="/governance" 
              className="text-gray-400 hover:text-indigo-400 transition-colors"
            >
              Governance
            </Link>
            <span className="text-gray-700">•</span>
            <Link 
              href="/emergencies" 
              className="text-gray-400 hover:text-indigo-400 transition-colors"
            >
              Emergencies
            </Link>
            <span className="text-gray-700">•</span>
            <Link 
              href="/support" 
              className="text-gray-400 hover:text-indigo-400 transition-colors"
            >
              Support
            </Link>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
