"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Loader2,
  Check,
  AlertTriangle,
  ExternalLink,
  FileText,
  Zap,
  Settings,
  Key,
  Edit3,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { usePropose, useCanPropose } from "@/hooks";
import {
  PROPOSAL_TEMPLATES,
  PROPOSAL_TYPE_INFO,
  type ProposalType,
  type ProposalTemplate,
} from "@/lib/governance/proposal-templates";
import { getTxExplorerUrl } from "@/lib/chain-utils";

// ============ Step Components ============

interface WizardStepProps {
  onNext: () => void;
  onBack: () => void;
  isFirst: boolean;
  isLast: boolean;
}

// Step 1: Choose Type & Template
function StepTypeTemplate({
  selectedType,
  setSelectedType,
  selectedTemplate,
  setSelectedTemplate,
  onNext,
}: {
  selectedType: ProposalType;
  setSelectedType: (t: ProposalType) => void;
  selectedTemplate: ProposalTemplate;
  setSelectedTemplate: (t: ProposalTemplate) => void;
} & Omit<WizardStepProps, "onBack" | "isFirst">) {
  const templateIcons: Record<string, React.ReactNode> = {
    "emergency-release": <Zap className="h-5 w-5" />,
    "update-threshold": <Settings className="h-5 w-5" />,
    "grant-role": <Key className="h-5 w-5" />,
    custom: <Edit3 className="h-5 w-5" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Proposal Type Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-3">
          Proposal Type
        </label>
        <div className="grid grid-cols-3 gap-3">
          {(Object.keys(PROPOSAL_TYPE_INFO) as ProposalType[]).map((type) => {
            const info = PROPOSAL_TYPE_INFO[type];
            const isSelected = selectedType === type;
            return (
              <motion.button
                key={type}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedType(type)}
                className={cn(
                  "p-4 rounded-xl border text-left transition-all",
                  isSelected
                    ? info.color + " border-2"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                )}
              >
                <span className="text-2xl">{info.icon}</span>
                <p className="font-semibold text-white mt-2">{info.label}</p>
                <p className="text-xs text-gray-400 mt-1">{info.description}</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Template Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-3">
          Choose a Template
        </label>
        <div className="space-y-2">
          {PROPOSAL_TEMPLATES.map((template) => {
            const isSelected = selectedTemplate.id === template.id;
            return (
              <motion.button
                key={template.id}
                whileHover={{ scale: 1.005 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => {
                  setSelectedTemplate(template);
                  setSelectedType(template.defaultType);
                }}
                className={cn(
                  "w-full p-4 rounded-xl border flex items-center space-x-4 text-left transition-all",
                  isSelected
                    ? "border-indigo-500/50 bg-indigo-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                )}
              >
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-lg",
                    isSelected ? "bg-indigo-500/30 text-indigo-400" : "bg-gray-700 text-gray-400"
                  )}
                >
                  {templateIcons[template.id] || <FileText className="h-5 w-5" />}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-white">
                    {template.icon} {template.name}
                  </p>
                  <p className="text-xs text-gray-400">{template.description}</p>
                </div>
                {isSelected && (
                  <Check className="h-5 w-5 text-indigo-400" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Next Button */}
      <div className="flex justify-end pt-4">
        <Button variant="primary" onClick={onNext}>
          Next
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// Step 2: Details (Title, Description, Template Fields)
function StepDetails({
  title,
  setTitle,
  description,
  setDescription,
  templateValues,
  setTemplateValues,
  template,
  onNext,
  onBack,
}: {
  title: string;
  setTitle: (t: string) => void;
  description: string;
  setDescription: (d: string) => void;
  templateValues: Record<string, string>;
  setTemplateValues: (v: Record<string, string>) => void;
  template: ProposalTemplate;
} & WizardStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (name: string, value: string) => {
    setTemplateValues({ ...templateValues, [name]: value });
    // Clear error when user types
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!title.trim()) {
      newErrors.title = "Title is required";
    }
    if (!description.trim()) {
      newErrors.description = "Description is required";
    }

    // Validate template fields
    template.fields.forEach((field) => {
      const value = templateValues[field.name] || "";
      if (field.required && !value.trim()) {
        newErrors[field.name] = `${field.label} is required`;
      } else if (field.validation && value) {
        const error = field.validation(value);
        if (error) newErrors[field.name] = error;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onNext();
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Proposal Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter a clear, descriptive title..."
          className={cn(
            "w-full rounded-lg bg-black/30 border px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none",
            errors.title ? "border-red-500" : "border-white/10 focus:border-indigo-500"
          )}
        />
        {errors.title && (
          <p className="text-xs text-red-400 mt-1">{errors.title}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-400 mb-2">
          Description *
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide context, rationale, and details about your proposal..."
          rows={4}
          className={cn(
            "w-full rounded-lg bg-black/30 border px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none resize-none",
            errors.description ? "border-red-500" : "border-white/10 focus:border-indigo-500"
          )}
        />
        {errors.description && (
          <p className="text-xs text-red-400 mt-1">{errors.description}</p>
        )}
      </div>

      {/* Template-specific Fields */}
      {template.fields.length > 0 && (
        <div className="space-y-4 pt-4 border-t border-white/10">
          <p className="text-sm font-medium text-gray-400">
            Template Fields
          </p>
          {template.fields.map((field) => (
            <div key={field.name}>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                {field.label} {field.required && "*"}
              </label>
              
              {field.type === "textarea" ? (
                <textarea
                  value={templateValues[field.name] || ""}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  rows={3}
                  className={cn(
                    "w-full rounded-lg bg-black/30 border px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none resize-none",
                    errors[field.name] ? "border-red-500" : "border-white/10 focus:border-indigo-500"
                  )}
                />
              ) : field.type === "select" ? (
                <select
                  value={templateValues[field.name] || ""}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  className={cn(
                    "w-full rounded-lg bg-black/30 border px-4 py-3 text-white focus:outline-none",
                    errors[field.name] ? "border-red-500" : "border-white/10 focus:border-indigo-500"
                  )}
                >
                  <option value="">Select...</option>
                  {field.options?.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type={field.type === "number" ? "number" : "text"}
                  value={templateValues[field.name] || ""}
                  onChange={(e) => handleFieldChange(field.name, e.target.value)}
                  placeholder={field.placeholder}
                  className={cn(
                    "w-full rounded-lg bg-black/30 border px-4 py-3 text-white placeholder:text-gray-500 focus:outline-none",
                    field.type === "address" && "font-mono text-sm",
                    errors[field.name] ? "border-red-500" : "border-white/10 focus:border-indigo-500"
                  )}
                />
              )}
              
              {errors[field.name] && (
                <p className="text-xs text-red-400 mt-1">{errors[field.name]}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <Button variant="primary" onClick={handleNext}>
          Review
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </motion.div>
  );
}

// Step 3: Review & Submit
function StepReview({
  title,
  description,
  selectedType,
  template,
  templateValues,
  onBack,
  onSubmit,
  isPending,
  isConfirming,
  isSuccess,
  txHash,
  error,
  receiptError,
}: {
  title: string;
  description: string;
  selectedType: ProposalType;
  template: ProposalTemplate;
  templateValues: Record<string, string>;
  onSubmit: () => void;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  txHash?: string;
  error?: Error | null;
  receiptError?: Error | null;
} & Omit<WizardStepProps, "onNext" | "isLast">) {
  const typeInfo = PROPOSAL_TYPE_INFO[selectedType];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      {/* Success State */}
      {isSuccess && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-xl bg-emerald-500/10 border border-emerald-500/30 p-6 text-center"
        >
          <Check className="h-12 w-12 mx-auto text-emerald-400 mb-3" />
          <h3 className="text-xl font-bold text-white mb-2">
            Proposal Created!
          </h3>
          <p className="text-gray-400 mb-4">
            Your proposal has been submitted to the blockchain.
          </p>
          {txHash && (
            <a
              href={getTxExplorerUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-indigo-400 hover:text-indigo-300"
            >
              View Transaction
              <ExternalLink className="ml-1 h-4 w-4" />
            </a>
          )}
        </motion.div>
      )}

      {/* Error State */}
      {(error || receiptError) && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 space-y-2">
          <div className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-4 w-4" />
            <p className="text-sm font-semibold">
              {receiptError ? "Transaction Failed" : "Submission Error"}
            </p>
          </div>
          <p className="text-xs text-red-400/80">
            {receiptError 
              ? "The transaction was sent but failed to execute on-chain. This could be due to insufficient voting power or gas." 
              : error?.message || "Failed to create proposal"}
          </p>
          {txHash && receiptError && (
            <a
              href={getTxExplorerUrl(txHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs text-red-400 underline hover:text-red-300"
            >
              View failed transaction <ExternalLink className="ml-1 h-3 w-3" />
            </a>
          )}
        </div>
      )}

      {/* Review Content */}
      {!isSuccess && (
        <>
          {/* Type Badge */}
          <div className={cn("inline-flex items-center rounded-lg border px-3 py-1.5", typeInfo.color)}>
            <span className="mr-2">{typeInfo.icon}</span>
            <span className="font-medium">{typeInfo.label} Proposal</span>
          </div>

          {/* Title & Description */}
          <div className="rounded-xl bg-white/5 border border-white/10 p-4">
            <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
            <p className="text-gray-400 whitespace-pre-wrap">{description}</p>
          </div>

          {/* Template Fields Summary */}
          {template.fields.length > 0 && (
            <div className="rounded-xl bg-white/5 border border-white/10 p-4">
              <p className="text-sm font-medium text-gray-500 mb-3">
                {template.name} Details
              </p>
              <dl className="space-y-2">
                {template.fields.map((field) => (
                  <div key={field.name} className="flex justify-between">
                    <dt className="text-gray-400">{field.label}:</dt>
                    <dd className="text-white font-mono text-sm">
                      {templateValues[field.name] || "-"}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          )}

          {/* Gas Warning */}
          <div className="rounded-xl bg-yellow-500/10 border border-yellow-500/30 p-4 flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm text-yellow-400 font-medium">
                Transaction Required
              </p>
              <p className="text-xs text-yellow-400/70 mt-1">
                Creating a proposal requires a blockchain transaction. Please confirm in your wallet when prompted.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-4">
        <Button variant="ghost" onClick={onBack} disabled={isPending || isConfirming}>
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        
        {!isSuccess && (
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={isPending || (isConfirming && !receiptError)}
            className="bg-gradient-to-r from-indigo-500 to-purple-600"
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Confirm in Wallet...
              </>
            ) : (isConfirming && !receiptError) ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                🚀 Submit Proposal
              </>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

// ============ Main Wizard Component ============

export function ProposalWizard() {
  const { canPropose, thresholdFormatted, userVotesFormatted, shortfallFormatted, isLoading: loadingThreshold } = useCanPropose();
  const { propose, txHash, isPending, isConfirming, isSuccess, error, receiptError, reset } = usePropose();

  // Wizard State
  const [step, setStep] = useState(1);
  const [selectedType, setSelectedType] = useState<ProposalType>("standard");
  const [selectedTemplate, setSelectedTemplate] = useState<ProposalTemplate>(
    PROPOSAL_TEMPLATES.find((t) => t.id === "custom")!
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});

  const handleSubmit = useCallback(() => {
    const action = selectedTemplate.buildAction(templateValues);
    propose(selectedType, {
      title,
      description,
      targets: action.targets,
      values: action.values,
      calldatas: action.calldatas,
    });
  }, [propose, selectedType, selectedTemplate, title, description, templateValues]);

  const resetWizard = () => {
    setStep(1);
    setSelectedType("standard");
    setSelectedTemplate(PROPOSAL_TEMPLATES.find((t) => t.id === "custom")!);
    setTitle("");
    setDescription("");
    setTemplateValues({});
    reset();
  };

  // Can't propose check
  if (!loadingThreshold && !canPropose) {
    return (
      <Card variant="glass">
        <CardContent className="py-12 text-center">
          <AlertTriangle className="h-12 w-12 mx-auto text-yellow-400 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">
            Insufficient Voting Power
          </h3>
          <p className="text-gray-400 mb-4">
            You need at least <span className="text-white font-bold">{thresholdFormatted} RESCUE</span> voting power to create proposals.
          </p>
          <p className="text-sm text-gray-500">
            Your current voting power: {userVotesFormatted} RESCUE
            <br />
            Shortfall: {shortfallFormatted} RESCUE
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card variant="gradient">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Create Proposal</span>
          {/* Step Indicator */}
          <div className="flex items-center space-x-2">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={cn(
                  "h-2 w-8 rounded-full transition-colors",
                  step >= s ? "bg-indigo-500" : "bg-white/20"
                )}
              />
            ))}
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent>
        <AnimatePresence mode="wait">
          {step === 1 && (
            <StepTypeTemplate
              key="step1"
              selectedType={selectedType}
              setSelectedType={setSelectedType}
              selectedTemplate={selectedTemplate}
              setSelectedTemplate={setSelectedTemplate}
              onNext={() => setStep(2)}
              isLast={false}
            />
          )}

          {step === 2 && (
            <StepDetails
              key="step2"
              title={title}
              setTitle={setTitle}
              description={description}
              setDescription={setDescription}
              templateValues={templateValues}
              setTemplateValues={setTemplateValues}
              template={selectedTemplate}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
              isFirst={false}
              isLast={false}
            />
          )}

          {step === 3 && (
            <StepReview
              key="step3"
              title={title}
              description={description}
              selectedType={selectedType}
              template={selectedTemplate}
              templateValues={templateValues}
              onBack={() => setStep(2)}
              onSubmit={handleSubmit}
              isPending={isPending}
              isConfirming={isConfirming}
              isSuccess={isSuccess}
              txHash={txHash}
              error={error}
              receiptError={receiptError}
              isFirst={false}
            />
          )}
        </AnimatePresence>

        {/* Create Another */}
        {isSuccess && (
          <div className="pt-4 text-center">
            <Button variant="ghost" onClick={resetWizard}>
              Create Another Proposal
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
