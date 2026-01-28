import { BigInt } from "@graphprotocol/graph-ts"
import {
  ImpactRecorded,
  TierUpgrade as TierUpgradeEvent
} from "../generated/ImpactNFT/ImpactNFT"
import { Impact, TierUpgrade } from "../generated/schema"

export function handleImpactRecorded(event: ImpactRecorded): void {
  // Params: volunteer, tokenId, tasksCompleted, reputation, tier
  let volunteer = event.params.volunteer
  let id = volunteer.toHexString()
  
  let entity = Impact.load(id)
  if (entity == null) {
    entity = new Impact(id)
    entity.volunteer = volunteer
    entity.firstTaskAt = event.block.timestamp
    entity.totalRewards = BigInt.fromI32(0) // Will be updated if we track it
    entity.metadataCID = ""
  }
  
  entity.tokenId = event.params.tokenId
  entity.tasksCompleted = event.params.tasksCompleted
  entity.reputation = event.params.reputation
  entity.tier = event.params.tier
  entity.lastTaskAt = event.block.timestamp
  
  entity.save()
}

export function handleTierUpgrade(event: TierUpgradeEvent): void {
  // Save immutable log of tier upgrades
  let id = event.transaction.hash.toHexString() + "-" + event.logIndex.toString()
  let entity = new TierUpgrade(id)
  
  entity.volunteer = event.params.volunteer
  entity.oldTier = event.params.previousTier
  entity.newTier = event.params.newTier
  entity.timestamp = event.block.timestamp
  entity.transactionHash = event.transaction.hash
  
  entity.save()
  
  // Also update the mutable Impact entity
  let impactId = event.params.volunteer.toHexString()
  let impact = Impact.load(impactId)
  if (impact != null) {
      impact.tier = event.params.newTier
      impact.save()
  }
}
