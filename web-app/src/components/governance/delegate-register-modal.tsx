"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  User,
  FileText,
  Image as ImageIcon,
  Check,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useDelegateProfile,
  useDelegation,
  EIP712_DOMAIN,
  EIP712_TYPES,
} from "@/hooks/useDelegation";
import { useAccount, useSignTypedData } from "wagmi";

interface DelegateRegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function DelegateRegisterModal({
  isOpen,
  onClose,
}: DelegateRegisterModalProps) {
  const { address } = useAccount();
  const { votingPower, votingPowerFormatted, isDelegatedToSelf } =
    useDelegation();
  const { profile, registerProfile, removeProfile, hasProfile } =
    useDelegateProfile();
  const { signTypedDataAsync } = useSignTypedData();

  const [displayName, setDisplayName] = useState(profile?.displayName || "");
  const [statement, setStatement] = useState(profile?.statement || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when modal opens
  const resetForm = () => {
    setDisplayName(profile?.displayName || "");
    setStatement(profile?.statement || "");
    setSuccess(false);
    setError(null);
  };

  const handleSubmit = async () => {
    if (!displayName.trim()) {
      setError("Display name is required");
      return;
    }
    if (!statement.trim()) {
      setError("Statement is required");
      return;
    }
    if (displayName.length > 50) {
      setError("Display name must be 50 characters or less");
      return;
    }
    if (statement.length > 500) {
      setError("Statement must be 500 characters or less");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const timestamp = Math.floor(Date.now() / 1000);
      const avatar = ""; // Placeholder for future avatar support

      // 1. Sign the registration data
      const signature = await signTypedDataAsync({
        domain: EIP712_DOMAIN,
        types: EIP712_TYPES,
        primaryType: "DelegateProfile",
        message: {
          address: address as `0x${string}`,
          displayName: displayName.trim(),
          statement: statement.trim(),
          avatar: avatar,
          timestamp: BigInt(timestamp),
        },
      });

      // 2. Send to API via hook
      const result = await registerProfile(
        displayName.trim(),
        statement.trim(),
        timestamp,
        signature,
        avatar
      );

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          onClose();
          setSuccess(false);
        }, 1500);
      } else {
        setError(result.error || "Failed to save profile. Please try again.");
      }
    } catch (err) {
      console.error("Sign error:", err);
      setError(
        err instanceof Error ? err.message : "An error occurred. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRemove = async () => {
    if (confirm("Are you sure you want to remove your delegate profile?")) {
      setIsSubmitting(true);
      setError(null);
      
      try {
        const timestamp = Math.floor(Date.now() / 1000);
        
        // 1. Sign removal (use special values to identify removal signature if needed, 
        // but here we just sign the "DELETE" intent as per API logic)
        const signature = await signTypedDataAsync({
          domain: EIP712_DOMAIN,
          types: EIP712_TYPES,
          primaryType: "DelegateProfile",
          message: {
            address: address as `0x${string}`,
            displayName: "DELETE",
            statement: "DELETE",
            avatar: "",
            timestamp: BigInt(timestamp),
          },
        });

        const result = await removeProfile(timestamp, signature);
        if (result.success) {
          setDisplayName("");
          setStatement("");
          onClose();
        } else {
          setError(result.error || "Failed to remove profile.");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to sign removal");
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg max-h-[85vh] rounded-2xl bg-gray-900 border border-white/10 shadow-2xl flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-white/10 flex-shrink-0">
            <h2 className="text-xl font-bold text-white">
              {hasProfile ? "Edit Delegate Profile" : "Register as Delegate"}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="h-5 w-5 text-gray-400" />
            </button>
          </div>

          {/* Content - Scrollable */}
          <div className="p-6 space-y-6 overflow-y-auto flex-1">
            {/* Info banner */}
            <div className="rounded-xl bg-indigo-500/10 border border-indigo-500/30 p-4">
              <p className="text-sm text-indigo-300">
                🗳️ Registering as a delegate lets others find and delegate their
                voting power to you. Your on-chain voting activity will be visible.
              </p>
            </div>

            {/* Voting power requirement */}
            {!isDelegatedToSelf && (
              <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4 flex items-start space-x-3">
                <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm text-yellow-400 font-medium">
                    Self-delegation required
                  </p>
                  <p className="text-xs text-yellow-400/70 mt-1">
                    You must delegate to yourself before registering as a delegate.
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <div className="space-y-4">
              {/* Display Name */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-400 mb-2">
                  <User className="h-4 w-4 mr-2" />
                  Display Name *
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g., FloodAid, CryptoRelief"
                  maxLength={30}
                  className="w-full rounded-lg bg-black/30 border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {displayName.length}/30
                </p>
              </div>

              {/* Statement */}
              <div>
                <label className="flex items-center text-sm font-medium text-gray-400 mb-2">
                  <FileText className="h-4 w-4 mr-2" />
                  Statement *
                </label>
                <textarea
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  placeholder="Describe your voting philosophy or focus area..."
                  maxLength={280}
                  rows={3}
                  className="w-full rounded-lg bg-black/30 border border-white/10 px-4 py-3 text-white placeholder:text-gray-500 focus:border-indigo-500 focus:outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  {statement.length}/280
                </p>
              </div>

              {/* Preview */}
              <div className="rounded-xl bg-white/5 border border-white/10 p-4">
                <p className="text-xs text-gray-500 mb-2">Preview</p>
                <div className="flex items-center space-x-3">
                  <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <User className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-white">
                      {displayName || "Your Name"}
                    </p>
                    <p className="text-xs text-gray-400">
                      {votingPowerFormatted} RESCUE voting power
                    </p>
                  </div>
                </div>
                {statement && (
                  <p className="text-sm text-gray-400 mt-3 italic">
                    "{statement}"
                  </p>
                )}
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-center">
                <p className="text-sm text-red-400">{error}</p>
              </div>
            )}

            {/* Success */}
            {success && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-lg bg-emerald-500/10 border border-emerald-500/30 p-4 text-center"
              >
                <Check className="h-8 w-8 mx-auto text-emerald-400 mb-2" />
                <p className="text-emerald-400 font-medium">
                  Profile saved successfully!
                </p>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-white/10 flex-shrink-0">
            {hasProfile ? (
              <Button
                variant="ghost"
                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                onClick={handleRemove}
              >
                Remove Profile
              </Button>
            ) : (
              <div />
            )}

            <div className="flex space-x-3">
              <Button variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                onClick={handleSubmit}
                disabled={isSubmitting || success || (!isDelegatedToSelf && !hasProfile)}
              >
                {isSubmitting
                  ? "Saving..."
                  : hasProfile
                  ? "Update Profile"
                  : "Register"}
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
