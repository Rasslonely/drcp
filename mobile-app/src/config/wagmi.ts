import { createAppKit } from '@reown/appkit-react-native';
import { WagmiAdapter } from '@reown/appkit-wagmi-react-native';
import { liskSepolia } from '@reown/appkit/networks';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 1. Get Project ID
const projectId = 'c57ca95b47569778a828d19178114f4d'; // Test ID

// 2. Create Adapter
export const wagmiAdapter = new WagmiAdapter({
  networks: [liskSepolia],
  projectId,
});

// Custom Storage Adapter for Reown AppKit
const appKitStorage = {
  getItem: async <T = any>(key: string): Promise<T | undefined> => {
    const value = await AsyncStorage.getItem(key);
    return (value ?? undefined) as T;
  },
  setItem: async <T = any>(key: string, value: T): Promise<void> => {
    await AsyncStorage.setItem(key, value as unknown as string);
  },
  removeItem: async (key: string): Promise<void> => {
    await AsyncStorage.removeItem(key);
  },
  getKeys: async (): Promise<string[]> => {
    const keys = await AsyncStorage.getAllKeys();
    return keys as string[];
  },
  getEntries: async <T = any>(): Promise<[string, T][]> => {
    const keys = await AsyncStorage.getAllKeys();
    const entries = await AsyncStorage.multiGet(keys);
    return entries.map(([key, value]) => [key, (value ?? undefined) as T]);
  }
};

// 3. Create AppKit
createAppKit({
  adapters: [wagmiAdapter],
  networks: [liskSepolia],
  projectId,
  metadata: {
    name: 'DisasterProtocol',
    description: 'Web3 Disaster Relief App',
    url: 'https://disaster-protocol.app',
    icons: ['https://avatars.githubusercontent.com/u/179229932']
  },
  storage: appKitStorage,
  features: {
    socials: []
  }
});

// Export Config for WagmiProvider
export const config = wagmiAdapter.wagmiConfig;
