import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client';

// Graph Studio Subgraph URL - DRCP on Lisk Sepolia via Goldsky
// M-03 Audit Note: Always set NEXT_PUBLIC_SUBGRAPH_URL in production .env
const SUBGRAPH_URL = process.env.NEXT_PUBLIC_SUBGRAPH_URL || 
  'https://api.goldsky.com/api/public/project_cmk5jyye523yo01ya60379ew7/subgraphs/drcp-lisk/v2/gn';

// M-03 Audit Fix: Warn if using fallback URL
if (!process.env.NEXT_PUBLIC_SUBGRAPH_URL && typeof window !== "undefined") {
  console.warn(
    "⚠️ [DRCP] NEXT_PUBLIC_SUBGRAPH_URL is not set. " +
    "Using hardcoded fallback which may become outdated. " +
    "Set this in your .env.local for production."
  );
}

if (process.env.NODE_ENV === 'development') {
  console.log('🔗 Apollo Client: Using Subgraph URL:', SUBGRAPH_URL);
}

const httpLink = new HttpLink({
  uri: SUBGRAPH_URL,
});

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          // Merge deposits by id for pagination
          deposits: {
            keyArgs: ['where', 'orderBy', 'orderDirection'],
            merge(existing = [], incoming) {
              return [...incoming];
            },
          },
          // Merge tasks by id
          tasks: {
            keyArgs: ['where', 'orderBy', 'orderDirection'],
            merge(existing = [], incoming) {
              return [...incoming];
            },
          },
        },
      },
    },
  }),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: 'cache-and-network', // Show cache immediately, then update from network
      nextFetchPolicy: 'cache-first',  // Use cache for subsequent fetches to avoid 1-minute delays
      pollInterval: 30000,            // Increased to 30s to reduce background pressure
    },
    query: {
      fetchPolicy: 'cache-first',      // Prefer cache for one-off queries to bypass network latency
    },
  },
});

