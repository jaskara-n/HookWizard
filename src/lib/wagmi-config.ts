import { http, createConfig } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';

export const config = createConfig({
  chains: [mainnet, sepolia],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
  },
});

// Mock HookRegistry Contract
export const HOOK_REGISTRY_ADDRESS = '0x1234567890123456789012345678901234567890' as const;
export const POOL_MANAGER_ADDRESS = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd' as const;

export const HOOK_REGISTRY_ABI = [
  {
    name: 'getAuditedHook',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'hookFlags', type: 'uint256' }],
    outputs: [{ name: 'hookAddress', type: 'address' }],
  },
  {
    name: 'deployHook',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'hookFlags', type: 'uint256' },
      { name: 'salt', type: 'bytes32' },
    ],
    outputs: [{ name: 'hookAddress', type: 'address' }],
  },
] as const;

export const POOL_MANAGER_ABI = [
  {
    name: 'initialize',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'key', type: 'tuple', components: [
        { name: 'currency0', type: 'address' },
        { name: 'currency1', type: 'address' },
        { name: 'fee', type: 'uint24' },
        { name: 'tickSpacing', type: 'int24' },
        { name: 'hooks', type: 'address' },
      ]},
      { name: 'sqrtPriceX96', type: 'uint160' },
    ],
    outputs: [{ name: 'tick', type: 'int24' }],
  },
] as const;
