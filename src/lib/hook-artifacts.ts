import type { Abi, Hex } from "viem";
import limitOrderHookArtifact from "../../contracts/out/LimitOrderhook.sol/LimitOrderhook.json";
import limitOrderOnlyArtifact from "../../contracts/out/LimitOrderOnlyHook.sol/LimitOrderOnlyHook.json";
import feeThresholdArtifact from "../../contracts/out/FeeThresholdHook.sol/FeeThresholdHook.json";
import arcUsdcOnlyArtifact from "../../contracts/out/ArcUSDCOnlyHook.sol/ArcUSDCOnlyHook.json";
import hookFactoryArtifact from "../../contracts/out/HookFactory.sol/HookFactory.json";
import simpleSwapRouterArtifact from "../../contracts/out/SimpleSwapRouter.sol/SimpleSwapRouter.json";

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
  bytecode: limitOrderHookArtifact.bytecode.object as Hex,
  metadata: limitOrderHookArtifact.metadata,
  sourceName: "src/brand-token/LimitOrderhook.sol",
  contractName: "LimitOrderhook",
};

export const LIMIT_ORDER_ONLY_HOOK: HookArtifact = {
  abi: limitOrderOnlyArtifact.abi as Abi,
  bytecode: limitOrderOnlyArtifact.bytecode.object as Hex,
  metadata: limitOrderOnlyArtifact.metadata,
  sourceName: "src/brand-token/LimitOrderOnlyHook.sol",
  contractName: "LimitOrderOnlyHook",
};

export const FEE_THRESHOLD_HOOK: HookArtifact = {
  abi: feeThresholdArtifact.abi as Abi,
  bytecode: feeThresholdArtifact.bytecode.object as Hex,
  metadata: feeThresholdArtifact.metadata,
  sourceName: "src/brand-token/FeeThresholdHook.sol",
  contractName: "FeeThresholdHook",
};

export const ARC_USDC_ONLY_HOOK: HookArtifact = {
  abi: arcUsdcOnlyArtifact.abi as Abi,
  bytecode: arcUsdcOnlyArtifact.bytecode.object as Hex,
  metadata: arcUsdcOnlyArtifact.metadata,
  sourceName: "src/brand-token/ArcUSDCOnlyHook.sol",
  contractName: "ArcUSDCOnlyHook",
};

export const HOOK_FACTORY: HookArtifact = {
  abi: hookFactoryArtifact.abi as Abi,
  bytecode: hookFactoryArtifact.bytecode.object as Hex,
  metadata: hookFactoryArtifact.metadata,
  sourceName: "src/utils/HookFactory.sol",
  contractName: "HookFactory",
};

export const SIMPLE_SWAP_ROUTER: HookArtifact = {
  abi: simpleSwapRouterArtifact.abi as Abi,
  bytecode: simpleSwapRouterArtifact.bytecode.object as Hex,
  metadata: simpleSwapRouterArtifact.metadata,
  sourceName: "src/utils/SimpleSwapRouter.sol",
  contractName: "SimpleSwapRouter",
};
