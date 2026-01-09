import { gql } from "@apollo/client";

// ============================================================================
// GOVERNANCE - DELEGATE QUERIES
// ============================================================================

/**
 * Get top delegates by voting power
 */
export const GET_TOP_DELEGATES = gql`
  query GetTopDelegates($first: Int!, $skip: Int) {
    delegates(
      first: $first
      skip: $skip
      orderBy: votingPower
      orderDirection: desc
      where: { votingPower_gt: "0" }
    ) {
      id
      address
      votingPower
      delegatorsCount
      firstDelegatedAt
      lastUpdatedAt
    }
  }
`;

/**
 * Get delegate by address
 */
export const GET_DELEGATE = gql`
  query GetDelegate($id: Bytes!) {
    delegate(id: $id) {
      id
      address
      votingPower
      delegatorsCount
      firstDelegatedAt
      lastUpdatedAt
      delegators {
        id
        delegator
        balance
        delegatedAt
      }
    }
  }
`;

/**
 * Get delegation stats
 */
export const GET_DELEGATE_STATS = gql`
  query GetDelegateStats {
    delegateStats(id: "global") {
      totalDelegates
      totalDelegators
      totalVotingPower
      totalSupply
      delegationRate
    }
  }
`;

/**
 * Get delegations for an address
 */
export const GET_DELEGATIONS_BY_DELEGATOR = gql`
  query GetDelegationsByDelegator($delegator: Bytes!) {
    delegations(where: { delegator: $delegator }) {
      id
      delegator
      delegate {
        id
        address
        votingPower
      }
      balance
      delegatedAt
      lastUpdatedAt
    }
  }
`;

// ============================================================================
// EXISTING VAULT QUERIES (moved from inline)
// ============================================================================

export const GET_VAULT_STATS = gql`
  query GetVaultStats {
    vaultStats(id: "global") {
      totalDeposits
      totalWithdrawals
      totalTaskPayouts
      depositCount
      withdrawalCount
      taskCount
      completedTaskCount
      emergencyCount
      campaignCount
      activeCampaignCount
      totalCampaignRaised
    }
  }
`;

export const GET_RECENT_DEPOSITS = gql`
  query GetRecentDeposits($first: Int!, $skip: Int) {
    deposits(
      first: $first
      skip: $skip
      orderBy: blockTimestamp
      orderDirection: desc
    ) {
      id
      donor
      amount
      blockTimestamp
      transactionHash
    }
  }
`;

export const GET_DONOR_STATS = gql`
  query GetDonorStats($id: Bytes!) {
    donorStats(id: $id) {
      id
      totalDonated
      totalWithdrawn
      depositCount
    }
  }
`;

export const GET_CAMPAIGNS = gql`
  query GetCampaigns($first: Int!, $where: Campaign_filter) {
    campaigns(
      first: $first
      orderBy: createdAt
      orderDirection: desc
      where: $where
    ) {
      id
      campaignId
      name
      description
      targetAmount
      raisedAmount
      deadline
      status
      createdAt
      depositCount
    }
  }
`;
