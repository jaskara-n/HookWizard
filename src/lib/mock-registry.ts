// Mock Hook Registry - simulates on-chain lookup
// User will implement real contract calls later

export interface HookFlags {
  dynamicFees: boolean;
  limitOrders: boolean;
  timeLock: boolean;
  whitelist: boolean;
}

export interface AuditedHook {
  address: string;
  name: string;
  auditor: string;
  gasEstimate: number;
}

// Mock database of audited hooks
const AUDITED_HOOKS: Record<string, AuditedHook> = {
  // Dynamic Fees only
  '1000': {
    address: '0x1111111111111111111111111111111111111111',
    name: 'DynamicFeeHook v1.2',
    auditor: 'OpenZeppelin',
    gasEstimate: 45000,
  },
  // Limit Orders only
  '0100': {
    address: '0x2222222222222222222222222222222222222222',
    name: 'LimitOrderHook v2.0',
    auditor: 'Trail of Bits',
    gasEstimate: 52000,
  },
  // Dynamic Fees + Limit Orders
  '1100': {
    address: '0x3333333333333333333333333333333333333333',
    name: 'ComboFeeOrderHook v1.0',
    auditor: 'Consensys Diligence',
    gasEstimate: 68000,
  },
  // Time-Lock only
  '0010': {
    address: '0x4444444444444444444444444444444444444444',
    name: 'TimeLockHook v1.5',
    auditor: 'Sherlock',
    gasEstimate: 38000,
  },
};

function flagsToKey(flags: HookFlags): string {
  return `${flags.dynamicFees ? '1' : '0'}${flags.limitOrders ? '1' : '0'}${flags.timeLock ? '1' : '0'}${flags.whitelist ? '1' : '0'}`;
}

export function queryHookRegistry(flags: HookFlags): AuditedHook | null {
  const key = flagsToKey(flags);
  return AUDITED_HOOKS[key] || null;
}

export function generateCREATE2Salt(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return '0x' + Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function generateMockHookAddress(salt: string): string {
  // Simulate CREATE2 address derivation
  const hash = salt.slice(2, 42);
  return `0x${hash}`;
}

export const NEW_DEPLOY_GAS_ESTIMATE = 2100000;
