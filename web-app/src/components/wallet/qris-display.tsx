"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X, ZoomIn, Smartphone } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * QrisDisplay Component
 * 
 * Features:
 * - Shows cropped/zoomed QR barcode by default (easier to scan)
 * - Click to open full QRIS in modal overlay (uses Portal to escape transform context)
 * - Download button to save image
 * - Smooth animations
 */
export function QrisDisplay() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Ensure portal only renders on client
  useEffect(() => {
    setMounted(true);
  }, []);

  const handleDownload = async () => {
    const link = document.createElement("a");
    link.href = "/qris-support.jpeg";
    link.download = "QRIS-Rasslonely.jpeg";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Modal component to be portaled
  const ModalContent = (
    <AnimatePresence>
      {isModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
          onClick={() => setIsModalOpen(false)}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-white/10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-3 right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
            >
              <X className="h-5 w-5 text-white" />
            </button>

            {/* Title */}
            <h3 className="text-lg font-semibold text-white mb-4 text-center">
              ☕ Support Creator via QRIS
            </h3>

            {/* Full QRIS Image */}
            <div className="bg-white rounded-xl p-2 mb-4">
              <Image
                src="/qris-support.jpeg"
                alt="QRIS Code - Rasslonely"
                width={400}
                height={500}
                className="w-full h-auto rounded-lg"
                priority
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={handleDownload}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-xl",
                  "bg-amber-500 hover:bg-amber-600 text-white font-medium transition-colors"
                )}
              >
                <Download className="h-5 w-5" />
                Download QRIS
              </button>
            </div>

            {/* Instructions */}
            <div className="mt-4 text-center text-sm text-gray-400">
              <p className="flex items-center justify-center gap-2">
                <Smartphone className="h-4 w-4" />
                Scan with any Indonesian e-wallet or bank app
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <>
      {/* Main Display - Click to Expand */}
      <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
        {/* QR Code Preview - Cropped to show barcode larger */}
        <motion.button
          onClick={() => setIsModalOpen(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="relative w-52 h-52 mx-auto mb-4 rounded-xl overflow-hidden bg-white cursor-pointer group"
        >
          {/* Image cropped to show QR code area more prominently */}
          <div className="absolute inset-0 flex items-center justify-center">
            <Image
              src="/qris-support.jpeg"
              alt="QRIS Code - Rasslonely"
              width={280}
              height={280}
              className="object-cover scale-110 -translate-y-2"
              priority
            />
          </div>
          
          {/* Hover overlay with zoom hint */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex items-center gap-2 text-white font-medium">
              <ZoomIn className="h-5 w-5" />
              <span>Tap to Enlarge</span>
            </div>
          </div>

          {/* Subtle pulse indicator */}
          <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 rounded-full px-2 py-1 text-xs text-white">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Tap
          </div>
        </motion.button>

        <p className="text-white font-medium mb-1">Scan dengan</p>
        <p className="text-sm text-gray-400 mb-3">
          GoPay • OVO • DANA • ShopeePay • Bank App
        </p>

        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 Supported by all Indonesian e-wallets & banks</p>
          <p>🧾 Bukti transfer = screenshot chat ke @ras</p>
        </div>
      </div>

      {/* Portal modal to document.body to escape transform stacking context */}
      {mounted && createPortal(ModalContent, document.body)}
    </>
  );
}
