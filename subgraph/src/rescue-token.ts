import {
  DelegateChanged as DelegateChangedEvent,
  DelegateVotesChanged as DelegateVotesChangedEvent,
} from "../generated/RescueToken/RescueToken";
import { Delegate, Delegation, DelegateStats } from "../generated/schema";
import { BigInt, Bytes, Address, BigDecimal } from "@graphprotocol/graph-ts";

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const ZERO = BigInt.fromI32(0);
const ONE = BigInt.fromI32(1);
const GLOBAL_STATS_ID = "global";
const HUNDRED = BigDecimal.fromString("100");

function getOrCreateDelegate(address: Address, timestamp: BigInt): Delegate {
  let id = Bytes.fromHexString(address.toHexString().toLowerCase());
  let delegate = Delegate.load(id);

  if (delegate == null) {
    delegate = new Delegate(id);
    delegate.address = address;
    delegate.votingPower = ZERO;
    delegate.delegatorsCount = 0;
    delegate.firstDelegatedAt = timestamp;
    delegate.lastUpdatedAt = timestamp;
  }

  return delegate;
}

function getOrCreateDelegation(delegatorAddress: Address): Delegation {
  let id = Bytes.fromHexString(delegatorAddress.toHexString().toLowerCase());
  let delegation = Delegation.load(id);

  if (delegation == null) {
    delegation = new Delegation(id);
    delegation.delegator = delegatorAddress;
    delegation.balance = ZERO;
    delegation.delegatedAt = ZERO;
    delegation.lastUpdatedAt = ZERO;
  }

  return delegation;
}

function getOrCreateDelegateStats(): DelegateStats {
  let stats = DelegateStats.load(GLOBAL_STATS_ID);

  if (stats == null) {
    stats = new DelegateStats(GLOBAL_STATS_ID);
    stats.totalDelegates = 0;
    stats.totalDelegators = 0;
    stats.totalVotingPower = ZERO;
    stats.totalSupply = ZERO;
    stats.delegationRate = BigDecimal.fromString("0");
  }

  return stats;
}

function updateDelegationRate(stats: DelegateStats): void {
  if (stats.totalSupply.gt(ZERO)) {
    let votingPowerDecimal = stats.totalVotingPower.toBigDecimal();
    let supplyDecimal = stats.totalSupply.toBigDecimal();
    stats.delegationRate = votingPowerDecimal.times(HUNDRED).div(supplyDecimal);
  } else {
    stats.delegationRate = BigDecimal.fromString("0");
  }
}

// ============================================================================
// EVENT HANDLERS
// ============================================================================

/**
 * Handle DelegateChanged event
 * Emitted when an account delegates their voting power to a new delegate
 */
export function handleDelegateChanged(event: DelegateChangedEvent): void {
  let delegatorAddress = event.params.delegator;
  let fromDelegateAddress = event.params.fromDelegate;
  let toDelegateAddress = event.params.toDelegate;
  let timestamp = event.block.timestamp;

  // Skip if delegating to zero address (undelegating)
  let isZeroAddress = toDelegateAddress.equals(Address.zero());

  // Get or create delegation record
  let delegation = getOrCreateDelegation(delegatorAddress);
  let stats = getOrCreateDelegateStats();
  let isNewDelegator = delegation.delegatedAt.equals(ZERO);

  // Update old delegate (decrease delegator count)
  if (!fromDelegateAddress.equals(Address.zero())) {
    let fromDelegate = Delegate.load(
      Bytes.fromHexString(fromDelegateAddress.toHexString().toLowerCase())
    );
    if (fromDelegate != null) {
      fromDelegate.delegatorsCount = fromDelegate.delegatorsCount - 1;
      fromDelegate.lastUpdatedAt = timestamp;
      fromDelegate.save();
    }
  }

  // Update new delegate (increase delegator count)
  if (!isZeroAddress) {
    let toDelegate = getOrCreateDelegate(toDelegateAddress, timestamp);
    toDelegate.delegatorsCount = toDelegate.delegatorsCount + 1;
    toDelegate.lastUpdatedAt = timestamp;
    toDelegate.save();

    // Update delegation record
    delegation.delegate = toDelegate.id;
    delegation.delegatedAt = timestamp;
    delegation.lastUpdatedAt = timestamp;
    delegation.save();

    // Update stats
    if (isNewDelegator) {
      stats.totalDelegators = stats.totalDelegators + 1;
    }
  } else {
    // Undelegating - decrement delegator count
    if (!isNewDelegator) {
      stats.totalDelegators = stats.totalDelegators - 1;
    }
  }

  stats.save();
}

/**
 * Handle DelegateVotesChanged event
 * Emitted when a delegate's voting power changes
 */
export function handleDelegateVotesChanged(event: DelegateVotesChangedEvent): void {
  let delegateAddress = event.params.delegate;
  let previousVotes = event.params.previousVotes;
  let newVotes = event.params.newVotes;
  let timestamp = event.block.timestamp;

  // Skip zero address
  if (delegateAddress.equals(Address.zero())) {
    return;
  }

  // Get or create delegate
  let delegate = getOrCreateDelegate(delegateAddress, timestamp);
  let stats = getOrCreateDelegateStats();

  // Track if this is a new delegate with voting power
  let hadVotingPower = delegate.votingPower.gt(ZERO);
  let hasVotingPower = newVotes.gt(ZERO);

  // Update delegate voting power
  delegate.votingPower = newVotes;
  delegate.lastUpdatedAt = timestamp;
  delegate.save();

  // Update aggregate stats
  // Adjust total voting power
  if (newVotes.gt(previousVotes)) {
    stats.totalVotingPower = stats.totalVotingPower.plus(
      newVotes.minus(previousVotes)
    );
  } else {
    stats.totalVotingPower = stats.totalVotingPower.minus(
      previousVotes.minus(newVotes)
    );
  }

  // Track active delegate count
  if (!hadVotingPower && hasVotingPower) {
    stats.totalDelegates = stats.totalDelegates + 1;
  } else if (hadVotingPower && !hasVotingPower) {
    stats.totalDelegates = stats.totalDelegates - 1;
  }

  // Update delegation rate
  updateDelegationRate(stats);

  stats.save();
}
