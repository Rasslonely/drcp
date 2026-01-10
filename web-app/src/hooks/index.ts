// Re-export all hooks
export { useVaultStats, useTaskCount } from "./useVaultStats";
export { useImpact, useHasImpactNFT, TIER_CONFIG, Tier } from "./useImpact";
export type { ImpactProfile } from "./useImpact";
export { 
  useDepositEvents, 
  useTaskVerifiedEvents, 
  useImpactRecordedEvents, 
  useAllTransactions, 
  useVolunteerLeaderboard 
} from "./useEvents";
export type { 
  DepositEvent, 
  TaskVerifiedEvent, 
  ImpactRecordedEvent, 
  TransactionEvent 
} from "./useEvents";
export {
  useProposals,
  useHasVoted,
  useVotingPower,
  useCastVote,
  useGovernanceSettings,
  ProposalState,
  ProposalType,
  VoteSupport,
} from "./useGovernance";
export type { ProposalDisplay } from "./useGovernance";
export {
  useAIEngineHealth,
  usePrediction,
  useEmergencyPredictions,
  useSeverityDisplay,
  DisasterType,
  AIEngineClient,
} from "./useAIEngine";
export type { 
  PredictionResponse, 
  Emergency, 
  HealthResponse as AIHealthResponse 
} from "./useAIEngine";
export {
  useDisasterFilters,
  REGION_DISPLAY,
  TYPE_DISPLAY,
  ALERT_LEVEL_DISPLAY,
} from "./useDisasterFilters";
export type {
  DisasterFilterState,
  DisasterFilterActions,
  FilterPreset,
} from "./useDisasterFilters";
export {
  useDisasterData,
  useIndonesiaDisasters,
  useEarthquakes,
  useCriticalDisasters,
} from "./useDisasterData";
export type { DisasterDataState, DisasterDataOptions } from "./useDisasterData";

// Phase 9: Transparency Analytics
export { useFundFlow } from "./useFundFlow";
export type { FlowNode, FlowLink, FundFlowData } from "./useFundFlow";
export { useTVLHistory } from "./useTVLHistory";
export type { TimeRange, TVLDataPoint } from "./useTVLHistory";

// Phase 10: Deep Governance - Delegation
export {
  useDelegation,
  useDelegate,
  useTopDelegates,
  useDelegateProfile,
} from "./useDelegation";
export type { DelegateInfo, DelegateProfile } from "./useDelegation";

// Phase 10: Deep Governance - Proposals
export {
  usePropose,
  useCanPropose,
  encodeProposalAction,
  createEmptyAction,
} from "./usePropose";
export type { ProposalParams } from "./usePropose";

// Phase 10: Deep Governance - Analytics
export {
  useVotingAnalytics,
  useProposalVotes,
} from "./useVotingAnalytics";
export type { VoteRecord, DelegateStats, VotingAnalyticsData } from "./useVotingAnalytics";

// Phase 11: Sustainable Revenue
export {
  useTreasuryBalance,
  useTreasuryDonate,
  useCreatorDonate,
} from "./useProjectTreasury";
export type { TreasuryStats } from "./useProjectTreasury";

// Real-Time Updates (fast polling for post-transaction updates)
export {
  useRealTimeDeposits,
  useRealTimeStats,
  usePollingVisibility,
  POLLING_INTERVALS,
} from "./useRealTime";

// Phase 12: Toast Notifications
export {
  toast,
  txToast,
  donationToast,
  walletErrorToast,
  copyToast,
  voteToast,
  delegationToast,
  loadingToast,
  dismissToast,
  promiseToast,
} from "./useToast";

// Phase 13: Task Management
export {
  useTask,
  useAllTasks,
  useMyTasks,
  useCreateTask,
  useVerifyAndPay,
  useCancelTask,
  useClaimTask,
  useSubmitProof,
  TaskStatus,
  TASK_STATUS_CONFIG,
} from "./useTasks";
export type { Task, TaskDisplay } from "./useTasks";
