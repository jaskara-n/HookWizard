import type { Abi, Hex } from "viem";
import limitOrderHookArtifact from "./artifacts/LimitOrderhook.json";
import limitOrderOnlyArtifact from "./artifacts/LimitOrderOnlyHook.json";
import feeThresholdArtifact from "./artifacts/FeeThresholdHook.json";
import arcUsdcOnlyArtifact from "./artifacts/ArcUSDCOnlyHook.json";
import hookFactoryArtifact from "./artifacts/HookFactory.json";
import simpleSwapRouterArtifact from "./artifacts/SimpleSwapRouter.json";

export interface HookArtifact {
  abi: Abi;
  bytecode: Hex;
  metadata: {
    compiler: { version: string };
    language: string;
    settings: Record<string, unknown>;
    sources: Record<string, unknown>;
  };
  sourceName: string;
  contractName: string;
}

export const LIMIT_ORDER_HOOK: HookArtifact = {
  abi: limitOrderHookArtifact.abi as Abi,
  bytecode: limitOrderHookArtifact.bytecode as Hex,
  metadata: limitOrderHookArtifact.metadata,
  sourceName: "src/brand-token/LimitOrderhook.sol",
  contractName: "LimitOrderhook",
};

export const LIMIT_ORDER_ONLY_HOOK: HookArtifact = {
  abi: limitOrderOnlyArtifact.abi as Abi,
  bytecode: limitOrderOnlyArtifact.bytecode as Hex,
  metadata: limitOrderOnlyArtifact.metadata,
  sourceName: "src/brand-token/LimitOrderOnlyHook.sol",
  contractName: "LimitOrderOnlyHook",
};

export const FEE_THRESHOLD_HOOK: HookArtifact = {
  abi: feeThresholdArtifact.abi as Abi,
  bytecode: feeThresholdArtifact.bytecode as Hex,
  metadata: feeThresholdArtifact.metadata,
  sourceName: "src/brand-token/FeeThresholdHook.sol",
  contractName: "FeeThresholdHook",
};

export const ARC_USDC_ONLY_HOOK: HookArtifact = {
  abi: arcUsdcOnlyArtifact.abi as Abi,
  bytecode: arcUsdcOnlyArtifact.bytecode as Hex,
  metadata: arcUsdcOnlyArtifact.metadata,
  sourceName: "src/brand-token/ArcUSDCOnlyHook.sol",
  contractName: "ArcUSDCOnlyHook",
};

export const HOOK_FACTORY: HookArtifact = {
  abi: hookFactoryArtifact.abi as Abi,
  bytecode: hookFactoryArtifact.bytecode as Hex,
  metadata: hookFactoryArtifact.metadata,
  sourceName: "src/utils/HookFactory.sol",
  contractName: "HookFactory",
};

export const SIMPLE_SWAP_ROUTER: HookArtifact = {
  abi: simpleSwapRouterArtifact.abi as Abi,
  bytecode: simpleSwapRouterArtifact.bytecode as Hex,
  metadata: simpleSwapRouterArtifact.metadata,
  sourceName: "src/utils/SimpleSwapRouter.sol",
  contractName: "SimpleSwapRouter",
};
