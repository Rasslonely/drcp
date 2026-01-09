
import { promises as fs } from 'fs';
import path from 'path';
import { AdminDeployClient } from './client';

async function getContractArtifact(contractPath: string) {
  try {
    // Navigate up from web-app to contracts/artifacts
    // web-app is root, so ../contracts/artifacts
    const filePath = path.join(process.cwd(), '../contracts/artifacts/src', contractPath);
    const data = await fs.readFile(filePath, 'utf8');
    return JSON.parse(data);
  } catch (e) {
    console.error("Error reading artifact:", e);
    return null;
  }
}

export default async function AdminPage() {
  const mockUSDC = await getContractArtifact('mocks/SimpleUSDC.sol/SimpleUSDC.json');
  const vault = await getContractArtifact('ParametricVault.sol/ParametricVault.json');

  if (!mockUSDC || !vault) {
    return (
      <div className="p-8 text-red-500">
        Error: Could not load contract artifacts. Make sure contracts are compiled.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-8">
      <AdminDeployClient 
        mockUSDCAbi={mockUSDC.abi} 
        mockUSDCBytecode={mockUSDC.bytecode}
        vaultAbi={vault.abi}
        vaultBytecode={vault.bytecode}
      />
    </div>
  );
}
