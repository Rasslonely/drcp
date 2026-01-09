"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { VAULT_ADDRESS } from "@/lib/contracts/deployments";
import { Copy, AlertTriangle } from "lucide-react";

export function QrDonation() {
  const address = VAULT_ADDRESS;
  // White QR on dark background (simplified)
  // Or just standard black on white for better scanability
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${address}`;
  
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-center p-4 bg-white rounded-xl mx-auto w-fit">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img 
          src={qrUrl} 
          alt="Wallet QR Code" 
          width={200}
          height={200}
          className="rounded-lg"
        />
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm text-gray-400 font-mono break-all px-4">
          {address}
        </p>
        <Button 
          variant="secondary" 
          size="sm" 
          onClick={handleCopy}
          className="gap-2 border-white/10 hover:bg-white/5"
        >
          <Copy className="h-3 w-3" />
          {copied ? "Copied!" : "Copy Address"}
        </Button>
      </div>

      <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 flex items-start gap-3 mt-4">
        <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
        <div className="text-xs text-yellow-200/80 text-left">
          <p className="font-semibold text-yellow-500 mb-1">Important</p>
          Send only <strong>USDC (Optimism Network)</strong> to this address. Sending other tokens may result in permanent loss.
        </div>
      </div>
    </div>
  );
}
