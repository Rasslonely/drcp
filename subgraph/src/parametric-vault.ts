import {
  Deposited as DepositedEvent,
  Withdrawn as WithdrawnEvent,
  TaskCreated as TaskCreatedEvent,
  TaskClaimed as TaskClaimedEvent,
  TaskProofSubmitted as TaskProofSubmittedEvent,
  TaskVerified as TaskVerifiedEvent,
  TaskCancelled as TaskCancelledEvent,
  EmergencyDeclared as EmergencyDeclaredEvent,
  EmergencySettled as EmergencySettledEvent,
  CampaignCreated as CampaignCreatedEvent,
  CampaignDeposit as CampaignDepositEvent,
  CampaignClosed as CampaignClosedEvent
} from "../generated/ParametricVault/ParametricVault"

import {
  Deposit,
  Withdrawal,
  Task,
  TaskVerified,
  Emergency,
  VaultStats,
  DonorStats,
  VolunteerStats,
  Campaign,
  CampaignDeposit,
  FinancialActivity
} from "../generated/schema"

import { BigInt, Bytes } from "@graphprotocol/graph-ts"

// Helper function to get or create VaultStats singleton
function getOrCreateVaultStats(): VaultStats {
  let stats = VaultStats.load("global")
  if (!stats) {
    stats = new VaultStats("global")
    stats.totalDeposits = BigInt.zero()
    stats.totalWithdrawals = BigInt.zero()
    stats.totalTaskPayouts = BigInt.zero()
    stats.depositCount = BigInt.zero()
    stats.withdrawalCount = BigInt.zero()
    stats.taskCount = BigInt.zero()
    stats.completedTaskCount = BigInt.zero()
    stats.emergencyCount = BigInt.zero()
    // Campaign stats
    stats.campaignCount = BigInt.zero()
    stats.activeCampaignCount = BigInt.zero()
    stats.totalCampaignRaised = BigInt.zero()
  }
  return stats
}

// Helper to get or create DonorStats
function getOrCreateDonorStats(donor: Bytes): DonorStats {
  let stats = DonorStats.load(donor)
  if (!stats) {
    stats = new DonorStats(donor)
    stats.totalDonated = BigInt.zero()
    stats.totalWithdrawn = BigInt.zero()
    stats.depositCount = BigInt.zero()
  }
  return stats
}

// Helper to get or create VolunteerStats
function getOrCreateVolunteerStats(volunteer: Bytes): VolunteerStats {
  let stats = VolunteerStats.load(volunteer)
  if (!stats) {
    stats = new VolunteerStats(volunteer)
    stats.totalEarned = BigInt.zero()
    stats.tasksCompleted = BigInt.zero()
  }
  return stats
}

// ============ EVENT HANDLERS ============

export function handleDeposited(event: DepositedEvent): void {
  // Create immutable deposit record
  let deposit = new Deposit(event.transaction.hash)
  deposit.donor = event.params.donor
  deposit.amount = event.params.amount
  deposit.blockNumber = event.block.number
  deposit.blockTimestamp = event.block.timestamp
  deposit.transactionHash = event.transaction.hash
  deposit.save()

  // Unified Ledger: FinancialActivity
  let activity = new FinancialActivity(event.transaction.hash)
  activity.type = "DEPOSIT"
  activity.amount = event.params.amount
  activity.donor = event.params.donor
  activity.blockNumber = event.block.number
  activity.blockTimestamp = event.block.timestamp
  activity.transactionHash = event.transaction.hash
  activity.save()

  // Update vault stats
  let vaultStats = getOrCreateVaultStats()
  vaultStats.totalDeposits = vaultStats.totalDeposits.plus(event.params.amount)
  vaultStats.depositCount = vaultStats.depositCount.plus(BigInt.fromI32(1))
  vaultStats.save()

  // Update donor stats
  let donorStats = getOrCreateDonorStats(event.params.donor)
  donorStats.totalDonated = donorStats.totalDonated.plus(event.params.amount)
  donorStats.depositCount = donorStats.depositCount.plus(BigInt.fromI32(1))
  donorStats.save()
}

export function handleWithdrawn(event: WithdrawnEvent): void {
  // Create immutable withdrawal record
  let withdrawal = new Withdrawal(event.transaction.hash)
  withdrawal.donor = event.params.donor
  withdrawal.amount = event.params.amount
  withdrawal.blockNumber = event.block.number
  withdrawal.blockTimestamp = event.block.timestamp
  withdrawal.transactionHash = event.transaction.hash
  withdrawal.save()

  // Unified Ledger: FinancialActivity
  let activity = new FinancialActivity(event.transaction.hash)
  activity.type = "WITHDRAWAL"
  activity.amount = event.params.amount
  activity.donor = event.params.donor
  activity.blockNumber = event.block.number
  activity.blockTimestamp = event.block.timestamp
  activity.transactionHash = event.transaction.hash
  activity.save()

  // Update vault stats
  let vaultStats = getOrCreateVaultStats()
  vaultStats.totalWithdrawals = vaultStats.totalWithdrawals.plus(event.params.amount)
  vaultStats.withdrawalCount = vaultStats.withdrawalCount.plus(BigInt.fromI32(1))
  vaultStats.save()

  // Update donor stats
  let donorStats = getOrCreateDonorStats(event.params.donor)
  donorStats.totalWithdrawn = donorStats.totalWithdrawn.plus(event.params.amount)
  donorStats.save()
}

export function handleTaskCreated(event: TaskCreatedEvent): void {
  let taskId = event.params.taskId.toString()
  let task = new Task(taskId)
  task.taskId = event.params.taskId
  task.description = event.params.description
  task.reward = event.params.reward
  task.status = "OPEN"
  task.createdAt = event.block.timestamp
  task.transactionHash = event.transaction.hash
  task.save()

  // Update vault stats
  let vaultStats = getOrCreateVaultStats()
  vaultStats.taskCount = vaultStats.taskCount.plus(BigInt.fromI32(1))
  vaultStats.save()
}

export function handleTaskClaimed(event: TaskClaimedEvent): void {
  let taskId = event.params.taskId.toString()
  let task = Task.load(taskId)
  if (task) {
    task.volunteer = event.params.volunteer
    task.status = "CLAIMED"
    task.claimedAt = event.block.timestamp
    task.save()
  }
}

export function handleTaskProofSubmitted(event: TaskProofSubmittedEvent): void {
  let taskId = event.params.taskId.toString()
  let task = Task.load(taskId)
  if (task) {
    task.proofHash = event.params.proofHash
    task.status = "PROOF_SUBMITTED"
    task.proofSubmittedAt = event.block.timestamp
    task.save()
  }
}

export function handleTaskVerified(event: TaskVerifiedEvent): void {
  let taskId = event.params.taskId.toString()
  let task = Task.load(taskId)
  if (task) {
    task.status = "PAID"
    task.verifiedAt = event.block.timestamp
    task.save()
  }

  // Create immutable verification record
  let verified = new TaskVerified(event.transaction.hash)
  verified.taskId = event.params.taskId
  verified.volunteer = event.params.volunteer
  verified.reward = event.params.reward
  verified.blockNumber = event.block.number
  verified.blockTimestamp = event.block.timestamp
  verified.transactionHash = event.transaction.hash
  verified.save()

  // Unified Ledger: FinancialActivity
  let activity = new FinancialActivity(event.transaction.hash)
  activity.type = "PAYOUT"
  activity.amount = event.params.reward
  activity.volunteer = event.params.volunteer
  activity.taskId = event.params.taskId
  activity.blockNumber = event.block.number
  activity.blockTimestamp = event.block.timestamp
  activity.transactionHash = event.transaction.hash
  activity.save()

  // Update vault stats
  let vaultStats = getOrCreateVaultStats()
  vaultStats.totalTaskPayouts = vaultStats.totalTaskPayouts.plus(event.params.reward)
  vaultStats.completedTaskCount = vaultStats.completedTaskCount.plus(BigInt.fromI32(1))
  vaultStats.save()

  // Update volunteer stats
  let volunteerStats = getOrCreateVolunteerStats(event.params.volunteer)
  volunteerStats.totalEarned = volunteerStats.totalEarned.plus(event.params.reward)
  volunteerStats.tasksCompleted = volunteerStats.tasksCompleted.plus(BigInt.fromI32(1))
  volunteerStats.save()
}

export function handleTaskCancelled(event: TaskCancelledEvent): void {
  let taskId = event.params.taskId.toString()
  let task = Task.load(taskId)
  if (task) {
    task.status = "CANCELLED"
    task.save()
  }
}

export function handleEmergencyDeclared(event: EmergencyDeclaredEvent): void {
  let emergencyId = event.params.emergencyId.toString()
  let emergency = new Emergency(emergencyId)
  emergency.emergencyId = event.params.emergencyId
  emergency.disasterType = event.params.disasterType
  emergency.fundsAllocated = event.params.fundsAllocated
  emergency.totalDistributed = BigInt.zero()
  emergency.isActive = true
  emergency.startedAt = event.block.timestamp
  emergency.transactionHash = event.transaction.hash
  emergency.save()

  // Update vault stats
  let vaultStats = getOrCreateVaultStats()
  vaultStats.emergencyCount = vaultStats.emergencyCount.plus(BigInt.fromI32(1))
  vaultStats.save()
}

export function handleEmergencySettled(event: EmergencySettledEvent): void {
  let emergencyId = event.params.emergencyId.toString()
  let emergency = Emergency.load(emergencyId)
  if (emergency) {
    emergency.isActive = false
    emergency.totalDistributed = event.params.totalDistributed
    emergency.settledAt = event.block.timestamp
    emergency.save()
  }
}

// ============ CAMPAIGN EVENT HANDLERS ============

export function handleCampaignCreated(event: CampaignCreatedEvent): void {
  let campaignId = event.params.campaignId.toString()
  let campaign = new Campaign(campaignId)
  campaign.campaignId = event.params.campaignId
  campaign.name = event.params.name
  campaign.description = "" // Not in event, will be fetched from contract if needed
  campaign.targetAmount = event.params.targetAmount
  campaign.raisedAmount = BigInt.zero()
  campaign.deadline = BigInt.zero() // Not in event
  campaign.geoHash = event.params.geoHash
  campaign.status = "ACTIVE"
  campaign.createdAt = event.block.timestamp
  campaign.depositCount = BigInt.zero()
  campaign.transactionHash = event.transaction.hash
  campaign.save()

  // Update vault stats
  let vaultStats = getOrCreateVaultStats()
  vaultStats.campaignCount = vaultStats.campaignCount.plus(BigInt.fromI32(1))
  vaultStats.activeCampaignCount = vaultStats.activeCampaignCount.plus(BigInt.fromI32(1))
  vaultStats.save()
}

export function handleCampaignDeposit(event: CampaignDepositEvent): void {
  // Create immutable campaign deposit record
  let deposit = new CampaignDeposit(event.transaction.hash)
  deposit.campaign = event.params.campaignId.toString()
  deposit.donor = event.params.donor
  deposit.amount = event.params.amount
  deposit.blockNumber = event.block.number
  deposit.blockTimestamp = event.block.timestamp
  deposit.transactionHash = event.transaction.hash
  deposit.save()

  // Unified Ledger: FinancialActivity
  let activity = new FinancialActivity(event.transaction.hash)
  activity.type = "CAMPAIGN_DEPOSIT"
  activity.amount = event.params.amount
  activity.donor = event.params.donor
  activity.campaign = event.params.campaignId.toString()
  activity.blockNumber = event.block.number
  activity.blockTimestamp = event.block.timestamp
  activity.transactionHash = event.transaction.hash
  activity.save()

  // Update campaign stats
  let campaignId = event.params.campaignId.toString()
  let campaign = Campaign.load(campaignId)
  if (campaign) {
    campaign.raisedAmount = campaign.raisedAmount.plus(event.params.amount)
    campaign.depositCount = campaign.depositCount.plus(BigInt.fromI32(1))
    campaign.save()
  }

  // Update vault stats
  let vaultStats = getOrCreateVaultStats()
  vaultStats.totalDeposits = vaultStats.totalDeposits.plus(event.params.amount)
  vaultStats.totalCampaignRaised = vaultStats.totalCampaignRaised.plus(event.params.amount)
  vaultStats.depositCount = vaultStats.depositCount.plus(BigInt.fromI32(1))
  vaultStats.save()

  // Update donor stats
  let donorStats = getOrCreateDonorStats(event.params.donor)
  donorStats.totalDonated = donorStats.totalDonated.plus(event.params.amount)
  donorStats.depositCount = donorStats.depositCount.plus(BigInt.fromI32(1))
  donorStats.save()
}

export function handleCampaignClosed(event: CampaignClosedEvent): void {
  let campaignId = event.params.campaignId.toString()
  let campaign = Campaign.load(campaignId)
  if (campaign) {
    // Map status enum: 0=ACTIVE, 1=CLOSED, 2=EXPIRED
    let reason = event.params.reason
    if (reason == 1) {
      campaign.status = "CLOSED"
    } else if (reason == 2) {
      campaign.status = "EXPIRED"
    }
    campaign.closedAt = event.block.timestamp
    campaign.save()

    // Update vault stats
    let vaultStats = getOrCreateVaultStats()
    vaultStats.activeCampaignCount = vaultStats.activeCampaignCount.minus(BigInt.fromI32(1))
    vaultStats.save()
  }
}
