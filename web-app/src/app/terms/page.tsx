"use client";

import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, AlertTriangle, Scale, FileWarning } from "lucide-react";

export default function TermsOfServicePage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <PageHeader
        title="Terms of Service"
        subtitle="Please read these terms carefully before using DRCP"
        icon={Scale}
      />

      <div className="space-y-6 mt-8">
        {/* Beta Disclaimer */}
        <Card className="border-yellow-500/30 bg-yellow-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-yellow-500/20">
                <AlertTriangle className="h-6 w-6 text-yellow-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-yellow-400 mb-2">
                  ⚠️ Beta Software Disclaimer
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  DRCP (Disaster Relief Crypto Protocol) is currently in <strong>public beta</strong>.
                  This means the software is still under active development and may contain bugs,
                  errors, or unexpected behavior. Features may change without notice.
                </p>
                <p className="text-gray-400 mt-3 text-sm">
                  By using this protocol, you acknowledge that you are participating in a beta test
                  and accept the inherent risks associated with experimental software.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Smart Contract Risk Warning */}
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-500/20">
                <FileWarning className="h-6 w-6 text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-red-400 mb-2">
                  🔴 Smart Contract Risk Warning
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  This protocol interacts with smart contracts deployed on the Polygon blockchain.
                  Smart contracts are immutable code that handle real money. Despite best efforts
                  in development and testing:
                </p>
                <ul className="mt-3 space-y-2 text-gray-400 text-sm list-disc list-inside">
                  <li>Smart contracts may contain undiscovered vulnerabilities</li>
                  <li>Blockchain transactions are irreversible</li>
                  <li>Loss of funds is possible and may be unrecoverable</li>
                  <li>The protocol is currently <strong>UNAUDITED</strong> by professional security firms</li>
                </ul>
                <p className="text-red-400/80 mt-4 text-sm font-medium">
                  Never deposit more than you can afford to lose. Current TVL limit: $1,000 USDC.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Liability Disclaimer */}
        <Card className="border-gray-700">
          <CardContent className="pt-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-700">
                <Shield className="h-6 w-6 text-gray-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Limitation of Liability
                </h2>
                <p className="text-gray-300 leading-relaxed">
                  The DRCP development team provides this software &quot;as is&quot; without warranty
                  of any kind, express or implied. In no event shall the developers be liable for any:
                </p>
                <ul className="mt-3 space-y-2 text-gray-400 text-sm list-disc list-inside">
                  <li>Direct, indirect, incidental, or consequential damages</li>
                  <li>Loss of profits, data, or funds</li>
                  <li>Service interruptions or failures</li>
                  <li>Third-party actions or blockchain network issues</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Acceptance */}
        <Card className="border-indigo-500/30 bg-indigo-500/5">
          <CardContent className="pt-6">
            <h2 className="text-xl font-bold text-indigo-400 mb-3">
              Acceptance of Terms
            </h2>
            <p className="text-gray-300 leading-relaxed">
              By connecting your wallet and using DRCP, you confirm that you:
            </p>
            <ul className="mt-3 space-y-2 text-gray-400 text-sm list-disc list-inside">
              <li>Have read and understood these terms of service</li>
              <li>Accept all risks associated with using unaudited smart contracts</li>
              <li>Are of legal age to enter into this agreement in your jurisdiction</li>
              <li>Will not hold the development team liable for any losses</li>
              <li>Understand that this is beta software under active development</li>
            </ul>
          </CardContent>
        </Card>

        {/* Last Updated */}
        <p className="text-center text-gray-600 text-sm mt-8">
          Last updated: January 2026 | Version 1.0 (Beta)
        </p>
      </div>
    </div>
  );
}
