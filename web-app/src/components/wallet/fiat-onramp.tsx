"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CreditCard, ExternalLink } from "lucide-react";
import { VAULT_ADDRESS } from "@/lib/contracts/deployments";

export function FiatOnramp() {
  const address = VAULT_ADDRESS;
  
  // Transak URL Construction (Simulated)
  // In production, you would use your API Key
  const transakUrl = `https://global.transak.com/?cryptoCurrencyCode=USDC&network=optimism&walletAddress=${address}&fiatCurrency=IDR`;
  
  // MoonPay URL
  const moonpayUrl = `https://buy.moonpay.com?currencyCode=usdc_optimism&walletAddress=${address}`;

  return (
    <div className="grid grid-cols-1 gap-3">
      <Card variant="glass" className="border-white/5 bg-white/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <CreditCard className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-white">Transak</h4>
              <p className="text-xs text-gray-400">Buy with IDR / Card</p>
            </div>
          </div>
          <a href={transakUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </CardContent>
      </Card>

      <Card variant="glass" className="border-white/5 bg-white/5">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-500/20 rounded-lg">
              <CreditCard className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-left">
              <h4 className="font-semibold text-white">MoonPay</h4>
              <p className="text-xs text-gray-400">Global Payments</p>
            </div>
          </div>
          <a href={moonpayUrl} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
              <ExternalLink className="h-4 w-4" />
            </Button>
          </a>
        </CardContent>
      </Card>

      <p className="text-xs text-center text-gray-500 mt-2">
        You will be redirected to a third-party provider to complete your purchase.
        The crypto will be sent directly to the Disaster Vault.
      </p>
    </div>
  );
}
