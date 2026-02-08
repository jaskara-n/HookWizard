import type { Abi, Hex } from "viem";
import simpleErc20Artifact from "../../contracts/out/SimpleERC20.sol/SimpleERC20.json";

export interface TokenArtifact {
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

export const SIMPLE_ERC20: TokenArtifact = {
  abi: simpleErc20Artifact.abi as Abi,
  bytecode: simpleErc20Artifact.bytecode.object as Hex,
  metadata: simpleErc20Artifact.metadata,
  sourceName: "src/utils/SimpleERC20.sol",
  contractName: "SimpleERC20",
};
