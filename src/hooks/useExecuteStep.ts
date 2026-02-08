import { useEffect, useMemo, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import {
  concatHex,
  encodeAbiParameters,
  keccak256,
  parseUnits,
  formatUnits,
  type Address,
  type Hex,
} from "viem";

import type { HookFlags, AuditedHook } from "@/lib/hook-registry";
import type { PoolConfig } from "@/components/wizard/PoolSelectStep";
import {
  getV4Addresses,
  getPermit2,
  isV4Supported,
} from "@/lib/uniswap-v4-registry";
import {
  buildPoolKey,
  computePoolId,
  ZERO_ADDRESS,
} from "@/lib/uniswap-v4-utils";
import {
  ERC20_ABI,
  HOOK_FACTORY_ABI,
  HOOK_METRICS_ABI,
  PERMIT2_ABI,
  POOL_MANAGER_ABI,
  POSITION_MANAGER_ABI,
  SIMPLE_SWAP_ROUTER_ABI,
  STATE_VIEW_ABI,
} from "@/lib/uniswap-v4-abi";
import {
  FEE_THRESHOLD_HOOK,
  HOOK_FACTORY,
  LIMIT_ORDER_HOOK,
  LIMIT_ORDER_ONLY_HOOK,
  SIMPLE_SWAP_ROUTER,
} from "@/lib/hook-artifacts";
import {
  encodeSqrtPriceX96,
  getLiquidityForAmounts,
  getSqrtRatioAtTick,
  maxUsableTick,
  minUsableTick,
  MIN_SQRT_RATIO,
  MAX_SQRT_RATIO,
} from "@/lib/v4-math";
import { mineHookSalt } from "@/lib/hook-miner";
import { generateHookCode } from "@/lib/hook-code-generator";

const ACTION_MINT_POSITION = 0x02;
const ACTION_SETTLE_PAIR = 0x0d;

export interface UseExecuteStepArgs {
  poolConfig: PoolConfig;
  flags: HookFlags;
  agentPrompt: string;
  deployChoice: "existing" | "custom" | null;
  auditedHook: AuditedHook | null;
  deployedAddress: string | null;
  onDeployedAddressChange: (address: string | null) => void;
}

export function useExecuteStep({
  poolConfig,
  flags,
  agentPrompt,
  deployChoice,
  auditedHook,
  deployedAddress,
  onDeployedAddressChange,
}: UseExecuteStepArgs) {
  const [code, setCode] = useState("");
  const { address: walletAddress, isConnected } = useAccount();
  const publicClient = usePublicClient({ chainId: poolConfig.chainId });
  const { data: walletClient } = useWalletClient({
    chainId: poolConfig.chainId,
  });

  const registry = getV4Addresses(poolConfig.chainId);

  const [addressOverrides, setAddressOverrides] = useState({
    poolManager: "",
    positionManager: "",
    stateView: "",
    permit2: "",
  });
  const [showOverrides, setShowOverrides] = useState(false);

  const [hookFactoryAddress, setHookFactoryAddress] = useState("");
  const [isMining, setIsMining] = useState(false);
  const [minedSalt, setMinedSalt] = useState<Hex | null>(null);
  const [predictedHook, setPredictedHook] = useState<Address | null>(null);
  const [hookDeploying, setHookDeploying] = useState(false);

  const [poolInitStatus, setPoolInitStatus] = useState<string | null>(null);
  const [initialPrice, setInitialPrice] = useState("1.0");

  const [amount0Input, setAmount0Input] = useState("");
  const [amount1Input, setAmount1Input] = useState("");
  const [slippageBps, setSlippageBps] = useState("50");
  const [liquidityStatus, setLiquidityStatus] = useState<string | null>(null);

  const [token0Decimals, setToken0Decimals] = useState(18);
  const [token1Decimals, setToken1Decimals] = useState(18);

  const [swapRouterAddress, setSwapRouterAddress] = useState("");
  const [swapAmount, setSwapAmount] = useState("");
  const [swapZeroForOne, setSwapZeroForOne] = useState(true);
  const [swapStatus, setSwapStatus] = useState<string | null>(null);
  const [swapApprovalStatus, setSwapApprovalStatus] = useState<string | null>(
    null,
  );

  const [metrics, setMetrics] = useState<{
    sqrtPriceX96?: bigint;
    tick?: number;
    liquidity?: bigint;
    feesCollected?: bigint;
    feesDistributed?: bigint;
    feesAccrued?: bigint;
    executedOrders?: bigint;
  }>({});

  const [lookup, setLookup] = useState({
    tokenA: "",
    tokenB: "",
    fee: "3000",
    tickSpacing: "60",
    hook: "",
    poolId: "",
  });
  const [lookupResult, setLookupResult] = useState<{
    sqrtPriceX96?: bigint;
    tick?: number;
    liquidity?: bigint;
  } | null>(null);

  useEffect(() => {
    setCode(generateHookCode(flags, agentPrompt));
  }, [flags, agentPrompt]);

  useEffect(() => {
    setAddressOverrides({
      poolManager: registry?.poolManager ?? "",
      positionManager: registry?.positionManager ?? "",
      stateView: registry?.stateView ?? "",
      permit2: registry?.permit2 ?? getPermit2(poolConfig.chainId),
    });
    setShowOverrides(!isV4Supported(poolConfig.chainId));
  }, [poolConfig.chainId, registry]);

  useEffect(() => {
    if (!swapRouterAddress && registry?.universalRouter) {
      setSwapRouterAddress(registry.universalRouter);
    }
  }, [registry, swapRouterAddress]);

  type ReadContractParams =
    Parameters<NonNullable<typeof publicClient>["readContract"]>[0];
  const readContract = async <T,>(params: ReadContractParams) => {
    if (!publicClient) throw new Error("Public client not ready");
    console.groupCollapsed("[HookWizard] readContract");
    console.log(params);
    console.groupEnd();
    return (await publicClient.readContract({
      authorizationList: [],
      ...params,
    } as ReadContractParams & { authorizationList: readonly unknown[] })) as T;
  };

  const logTx = (label: string, payload: Record<string, unknown>) => {
    console.groupCollapsed(`[HookWizard] ${label}`);
    console.log(payload);
    console.groupEnd();
  };

  const resolvedAddresses = {
    poolManager: registry?.poolManager ?? "",
    positionManager: registry?.positionManager ?? "",
    stateView: registry?.stateView ?? "",
    permit2: registry?.permit2 ?? getPermit2(poolConfig.chainId),
  };

  const poolManagerAddress = (
    (showOverrides
      ? addressOverrides.poolManager
      : resolvedAddresses.poolManager) || ""
  ) as Address;
  const positionManagerAddress = (
    (showOverrides
      ? addressOverrides.positionManager
      : resolvedAddresses.positionManager) || ""
  ) as Address;
  const stateViewAddress = (
    (showOverrides ? addressOverrides.stateView : resolvedAddresses.stateView) ||
    ""
  ) as Address;
  const permit2Address = (
    (showOverrides ? addressOverrides.permit2 : resolvedAddresses.permit2) ||
    getPermit2(poolConfig.chainId)
  ) as Address;

  const selectedHookArtifact = useMemo(() => {
    if (flags.feeThreshold && flags.limitOrders) return LIMIT_ORDER_HOOK;
    if (flags.feeThreshold) return FEE_THRESHOLD_HOOK;
    if (flags.limitOrders) return LIMIT_ORDER_ONLY_HOOK;
    return null;
  }, [flags]);

  const hookAddress = useMemo(() => {
    if (deployChoice === "existing" && auditedHook)
      return auditedHook.address as Address;
    if (deployChoice === "custom") {
      return (deployedAddress || predictedHook || ZERO_ADDRESS) as Address;
    }
    return ZERO_ADDRESS;
  }, [deployChoice, auditedHook, deployedAddress, predictedHook]);

  const poolKey = useMemo(() => {
    if (!poolConfig.tokenAAddress || !poolConfig.tokenBAddress) return null;
    return buildPoolKey({
      tokenA: poolConfig.tokenAAddress as Address,
      tokenB: poolConfig.tokenBAddress as Address,
      fee: poolConfig.feeTier,
      tickSpacing: poolConfig.tickSpacing,
      hooks: hookAddress,
    });
  }, [poolConfig, hookAddress]);

  const poolId = useMemo(
    () => (poolKey ? computePoolId(poolKey) : null),
    [poolKey],
  );

  useEffect(() => {
    async function loadDecimals() {
      if (!publicClient || !poolKey) return;
      try {
        if (poolKey.currency0 === ZERO_ADDRESS) {
          setToken0Decimals(18);
        } else {
          const decimals = await readContract<bigint>({
            address: poolKey.currency0,
            abi: ERC20_ABI,
            functionName: "decimals",
          });
          setToken0Decimals(Number(decimals));
        }
      } catch {
        setToken0Decimals(18);
      }
      try {
        if (poolKey.currency1 === ZERO_ADDRESS) {
          setToken1Decimals(18);
        } else {
          const decimals = await readContract<bigint>({
            address: poolKey.currency1,
            abi: ERC20_ABI,
            functionName: "decimals",
          });
          setToken1Decimals(Number(decimals));
        }
      } catch {
        setToken1Decimals(18);
      }
    }

    loadDecimals();
  }, [publicClient, poolKey]);

  const initCodeHash = useMemo(() => {
    if (
      !selectedHookArtifact ||
      !poolManagerAddress ||
      !poolConfig.stablecoinAddress
    )
      return null;
    const constructorArgs =
      selectedHookArtifact === LIMIT_ORDER_ONLY_HOOK
        ? [poolManagerAddress, poolConfig.stablecoinAddress]
        : [
            poolManagerAddress,
            poolConfig.treasuryAddress,
            poolConfig.stablecoinAddress,
          ];
    const encodedArgs = encodeAbiParameters(
      selectedHookArtifact === LIMIT_ORDER_ONLY_HOOK
        ? [
            { name: "poolManager", type: "address" },
            { name: "stablecoin", type: "address" },
          ]
        : [
            { name: "poolManager", type: "address" },
            { name: "treasury", type: "address" },
            { name: "stablecoin", type: "address" },
          ],
      constructorArgs as readonly Address[],
    );
    return keccak256(concatHex([selectedHookArtifact.bytecode, encodedArgs]));
  }, [
    selectedHookArtifact,
    poolManagerAddress,
    poolConfig.stablecoinAddress,
    poolConfig.treasuryAddress,
  ]);

  const initCode = useMemo(() => {
    if (
      !selectedHookArtifact ||
      !poolManagerAddress ||
      !poolConfig.stablecoinAddress
    )
      return null;
    const constructorArgs =
      selectedHookArtifact === LIMIT_ORDER_ONLY_HOOK
        ? [poolManagerAddress, poolConfig.stablecoinAddress]
        : [
            poolManagerAddress,
            poolConfig.treasuryAddress,
            poolConfig.stablecoinAddress,
          ];
    const encodedArgs = encodeAbiParameters(
      selectedHookArtifact === LIMIT_ORDER_ONLY_HOOK
        ? [
            { name: "poolManager", type: "address" },
            { name: "stablecoin", type: "address" },
          ]
        : [
            { name: "poolManager", type: "address" },
            { name: "treasury", type: "address" },
            { name: "stablecoin", type: "address" },
          ],
      constructorArgs as readonly Address[],
    );
    return concatHex([selectedHookArtifact.bytecode, encodedArgs]);
  }, [
    selectedHookArtifact,
    poolManagerAddress,
    poolConfig.stablecoinAddress,
    poolConfig.treasuryAddress,
  ]);

  const canDeployHook = Boolean(
    selectedHookArtifact && minedSalt && initCode && walletClient,
  );

  const handleDeployHookFactory = async (): Promise<Address | null> => {
    if (!walletClient || !publicClient) return null;
    try {
      logTx("deployHookFactory", { abi: "HOOK_FACTORY", bytecode: "[bytecode]" });
      const txHash = await walletClient.deployContract({
        abi: HOOK_FACTORY.abi,
        bytecode: HOOK_FACTORY.bytecode,
        args: [],
      });
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      if (receipt.contractAddress) {
        setHookFactoryAddress(receipt.contractAddress);
        return receipt.contractAddress;
      }
    } catch (error) {
      console.error(error);
    }
    return null;
  };

  const handleMineSalt = async () => {
    if (!publicClient || !walletClient || !initCodeHash) return;
    setIsMining(true);
    setMinedSalt(null);
    setPredictedHook(null);

    let factory = hookFactoryAddress;
    if (!factory) {
      const deployed = await handleDeployHookFactory();
      if (deployed) {
        factory = deployed;
      } else {
        factory = hookFactoryAddress;
      }
    }

    if (!factory) {
      setIsMining(false);
      return;
    }

    logTx("mineHookSalt", {
      deployer: factory,
      initCodeHash,
    });
    const result = await mineHookSalt({
      deployer: factory as Address,
      initCodeHash,
      onProgress: () => {},
    });

    if (result) {
      setMinedSalt(result.salt);
      setPredictedHook(result.address);
    }
    setIsMining(false);
  };

  const handlePrepareAndDeployHook = async () => {
    await handleMineSalt();
    await handleDeployHook();
  };

  const handleDeployHook = async () => {
    if (!walletClient || !publicClient || !initCode) return;
    setHookDeploying(true);
    try {
      if (!minedSalt || !hookFactoryAddress) {
        await handleMineSalt();
      }
      if (!minedSalt || !hookFactoryAddress) {
        setHookDeploying(false);
        return;
      }
      logTx("deployHook", {
        factory: hookFactoryAddress,
        salt: minedSalt,
        initCodeHash,
      });
      let gasLimit: bigint | undefined;
      try {
        const estimatedGas = await publicClient.estimateContractGas({
          address: hookFactoryAddress as Address,
          abi: HOOK_FACTORY_ABI,
          functionName: "deploy",
          args: [minedSalt, initCode],
        });
        gasLimit = (estimatedGas * 130n) / 100n;
      } catch (error) {
        console.warn("[HookWizard] gas estimate failed, letting wallet decide", error);
      }
      const txHash = await walletClient.writeContract({
        address: hookFactoryAddress as Address,
        abi: HOOK_FACTORY_ABI,
        functionName: "deploy",
        args: [minedSalt, initCode],
        gas: gasLimit,
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      if (predictedHook) {
        onDeployedAddressChange(predictedHook);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setHookDeploying(false);
    }
  };

  const sqrtPriceX96 = useMemo(() => {
    const parsed = Number(initialPrice);
    if (!Number.isFinite(parsed) || parsed <= 0) {
      return null;
    }
    const numerator = BigInt(Math.floor(parsed * 1e12));
    const denominator = 1_000_000_000_000n;
    return encodeSqrtPriceX96(numerator, denominator);
  }, [initialPrice]);

  const handleInitializePool = async () => {
    if (!walletClient || !publicClient || !poolKey || !sqrtPriceX96) return;
    if (!positionManagerAddress && !poolManagerAddress) return;
    setPoolInitStatus("pending");
    try {
      const args = [poolKey, sqrtPriceX96] as const;
      if (positionManagerAddress) {
        logTx("initializePool (posm)", {
          address: positionManagerAddress,
          args,
        });
        const txHash = await walletClient.writeContract({
          address: positionManagerAddress,
          abi: POSITION_MANAGER_ABI,
          functionName: "initializePool",
          args,
        });
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      } else {
        logTx("initializePool (manager)", {
          address: poolManagerAddress,
          args,
        });
        const txHash = await walletClient.writeContract({
          address: poolManagerAddress,
          abi: POOL_MANAGER_ABI,
          functionName: "initialize",
          args,
        });
        await publicClient.waitForTransactionReceipt({ hash: txHash });
      }
      setPoolInitStatus("success");
    } catch (error) {
      console.error(error);
      setPoolInitStatus("error");
    }
  };

  const handleApproveToken = async (token: Address, spender: Address) => {
    if (!walletClient || !publicClient) return;
    if (token === ZERO_ADDRESS) return;
    try {
      logTx("approvePermit2", {
        token,
        spender: permit2Address,
      });
      const approveHash = await walletClient.writeContract({
        address: token,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [
          permit2Address,
          BigInt(
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
          ),
        ],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });

      logTx("permit2Approve", {
        permit2: permit2Address,
        token,
        spender,
      });
      const permitHash = await walletClient.writeContract({
        address: permit2Address,
        abi: PERMIT2_ABI,
        functionName: "approve",
        args: [
          token,
          spender,
          BigInt("0xffffffffffffffffffff"),
          BigInt("0xffffffffffff"),
        ],
      });
      await publicClient.waitForTransactionReceipt({ hash: permitHash });
    } catch (error) {
      console.error(error);
    }
  };

  const handleAddLiquidity = async () => {
    if (!walletClient || !publicClient || !poolKey || !poolId) return;
    if (!positionManagerAddress) return;
    if (!stateViewAddress) {
      setLiquidityStatus("error");
      return;
    }

    try {
      setLiquidityStatus("pending");
      const amount0 = parseUnits(amount0Input || "0", token0Decimals);
      const amount1 = parseUnits(amount1Input || "0", token1Decimals);
      const tickLower = minUsableTick(poolConfig.tickSpacing);
      const tickUpper = maxUsableTick(poolConfig.tickSpacing);

      const slot0 = await readContract<
        readonly [bigint, number, number, number]
      >({
        address: stateViewAddress,
        abi: STATE_VIEW_ABI,
        functionName: "getSlot0",
        args: [poolId],
      });
      const sqrtPriceX96Local = slot0[0] as bigint;

      const sqrtPriceLower = getSqrtRatioAtTick(tickLower);
      const sqrtPriceUpper = getSqrtRatioAtTick(tickUpper);

      const liquidity = getLiquidityForAmounts(
        sqrtPriceX96Local,
        sqrtPriceLower,
        sqrtPriceUpper,
        amount0,
        amount1,
      );

      const slippage = BigInt(slippageBps);
      const amount0Max = (amount0 * (10_000n + slippage)) / 10_000n;
      const amount1Max = (amount1 * (10_000n + slippage)) / 10_000n;

      const actionBytes = concatHex([
        `0x${ACTION_MINT_POSITION.toString(16).padStart(2, "0")}`,
        `0x${ACTION_SETTLE_PAIR.toString(16).padStart(2, "0")}`,
      ]);

      const params: Hex[] = [
        encodeAbiParameters(
          [
            {
              name: "key",
              type: "tuple",
              components: [
                { name: "currency0", type: "address" },
                { name: "currency1", type: "address" },
                { name: "fee", type: "uint24" },
                { name: "tickSpacing", type: "int24" },
                { name: "hooks", type: "address" },
              ],
            },
            { name: "tickLower", type: "int24" },
            { name: "tickUpper", type: "int24" },
            { name: "liquidity", type: "uint256" },
            { name: "amount0Max", type: "uint128" },
            { name: "amount1Max", type: "uint128" },
            { name: "recipient", type: "address" },
            { name: "hookData", type: "bytes" },
          ],
          [
            poolKey,
            tickLower,
            tickUpper,
            liquidity,
            amount0Max,
            amount1Max,
            walletAddress!,
            "0x",
          ],
        ),
        encodeAbiParameters(
          [
            { name: "currency0", type: "address" },
            { name: "currency1", type: "address" },
          ],
          [poolKey.currency0, poolKey.currency1],
        ),
      ];

      const unlockData = encodeAbiParameters(
        [
          { name: "actions", type: "bytes" },
          { name: "params", type: "bytes[]" },
        ],
        [actionBytes, params],
      );

      const deadline = BigInt(Math.floor(Date.now() / 1000) + 900);
      const value = poolKey.currency0 === ZERO_ADDRESS ? amount0Max : 0n;

      logTx("modifyLiquidities", {
        positionManagerAddress,
        amount0: amount0.toString(),
        amount1: amount1.toString(),
        liquidity: liquidity.toString(),
        tickLower,
        tickUpper,
        amount0Max: amount0Max.toString(),
        amount1Max: amount1Max.toString(),
        deadline: deadline.toString(),
        value: value.toString(),
      });
      const txHash = await walletClient.writeContract({
        address: positionManagerAddress,
        abi: POSITION_MANAGER_ABI,
        functionName: "modifyLiquidities",
        args: [unlockData, deadline],
        value,
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });

      setLiquidityStatus("success");
    } catch (error) {
      console.error(error);
      setLiquidityStatus("error");
    }
  };

  const handleDeploySwapRouter = async () => {
    if (!walletClient || !publicClient || !poolManagerAddress) return;
    try {
      logTx("deploySwapRouter", { poolManagerAddress });
      const txHash = await walletClient.deployContract({
        abi: SIMPLE_SWAP_ROUTER.abi,
        bytecode: SIMPLE_SWAP_ROUTER.bytecode,
        args: [poolManagerAddress],
      });
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: txHash,
      });
      if (receipt.contractAddress) {
        setSwapRouterAddress(receipt.contractAddress);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleApproveSwapToken = async (token: Address) => {
    if (!walletClient || !publicClient || !swapRouterAddress) return;
    if (token === ZERO_ADDRESS) return;
    try {
      setSwapApprovalStatus("pending");
      logTx("approveSwapToken", {
        token,
        spender: swapRouterAddress,
      });
      const approveHash = await walletClient.writeContract({
        address: token,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [
          swapRouterAddress as Address,
          BigInt(
            "0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff",
          ),
        ],
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
      setSwapApprovalStatus("success");
    } catch (error) {
      console.error(error);
      setSwapApprovalStatus("error");
    }
  };

  const handleSwap = async () => {
    if (!walletClient || !publicClient || !poolKey || !swapRouterAddress)
      return;
    try {
      setSwapStatus("pending");
      const decimals = swapZeroForOne ? token0Decimals : token1Decimals;
      const amountIn = parseUnits(swapAmount || "0", decimals);
      const sqrtPriceLimit = swapZeroForOne
        ? MIN_SQRT_RATIO + 1n
        : MAX_SQRT_RATIO - 1n;

      const value =
        swapZeroForOne && poolKey.currency0 === ZERO_ADDRESS
          ? amountIn
          : !swapZeroForOne && poolKey.currency1 === ZERO_ADDRESS
            ? amountIn
            : 0n;

      logTx("swapExactIn", {
        swapRouterAddress,
        poolKey,
        swapZeroForOne,
        amountIn: amountIn.toString(),
        sqrtPriceLimit: sqrtPriceLimit.toString(),
        value: value.toString(),
      });
      const txHash = await walletClient.writeContract({
        address: swapRouterAddress as Address,
        abi: SIMPLE_SWAP_ROUTER_ABI,
        functionName: "swapExactIn",
        args: [poolKey, swapZeroForOne, amountIn, sqrtPriceLimit, "0x"],
        value,
      });
      await publicClient.waitForTransactionReceipt({ hash: txHash });
      setSwapStatus("success");
    } catch (error) {
      console.error(error);
      setSwapStatus("error");
    }
  };

  const refreshMetrics = async () => {
    if (!publicClient || !poolId) return;
    let slot0: readonly [bigint, number, number, number] | undefined;
    let liquidity: bigint | undefined;
    let feesCollected: bigint | undefined;
    let feesDistributed: bigint | undefined;
    let feesAccrued: bigint | undefined;
    let executedOrders: bigint | undefined;

    logTx("refreshMetrics", { poolId, hookAddress });
    try {
      slot0 = await readContract<readonly [bigint, number, number, number]>({
        address: stateViewAddress,
        abi: STATE_VIEW_ABI,
        functionName: "getSlot0",
        args: [poolId],
      });
    } catch (error) {
      console.error(error);
    }

    try {
      liquidity = await readContract<bigint>({
        address: stateViewAddress,
        abi: STATE_VIEW_ABI,
        functionName: "getLiquidity",
        args: [poolId],
      });
    } catch (error) {
      console.error(error);
    }

    if (hookAddress !== ZERO_ADDRESS) {
      if (flags.feeThreshold) {
        try {
          feesCollected = await readContract<bigint>({
            address: hookAddress,
            abi: HOOK_METRICS_ABI,
            functionName: "totalFeesCollected",
            args: [poolId],
          });
        } catch (error) {
          console.error(error);
        }

        try {
          feesDistributed = await readContract<bigint>({
            address: hookAddress,
            abi: HOOK_METRICS_ABI,
            functionName: "totalFeesDistributed",
            args: [poolId],
          });
        } catch (error) {
          console.error(error);
        }

        try {
          feesAccrued = await readContract<bigint>({
            address: hookAddress,
            abi: HOOK_METRICS_ABI,
            functionName: "accumulatedFees",
            args: [poolId],
          });
        } catch (error) {
          console.error(error);
        }
      }

      if (flags.limitOrders) {
        try {
          executedOrders = await readContract<bigint>({
            address: hookAddress,
            abi: HOOK_METRICS_ABI,
            functionName: "executedOrdersCount",
            args: [poolId],
          });
        } catch (error) {
          console.error(error);
        }
      }
    }

    setMetrics({
      sqrtPriceX96: slot0?.[0],
      tick: slot0 ? Number(slot0[1]) : undefined,
      liquidity,
      feesCollected,
      feesDistributed,
      feesAccrued,
      executedOrders,
    });
  };

  const handleLookup = async () => {
    if (!publicClient || !stateViewAddress) return;
    try {
      const key = buildPoolKey({
        tokenA: lookup.tokenA as Address,
        tokenB: lookup.tokenB as Address,
        fee: Number(lookup.fee),
        tickSpacing: Number(lookup.tickSpacing),
        hooks: lookup.hook as Address,
      });
      const id = computePoolId(key);
      logTx("lookupPool", { key, id });
      setLookup((prev) => ({ ...prev, poolId: id }));
      const slot0 = await readContract<
        readonly [bigint, number, number, number]
      >({
        address: stateViewAddress,
        abi: STATE_VIEW_ABI,
        functionName: "getSlot0",
        args: [id],
      });
      const liquidity = await readContract<bigint>({
        address: stateViewAddress,
        abi: STATE_VIEW_ABI,
        functionName: "getLiquidity",
        args: [id],
      });
      setLookupResult({
        sqrtPriceX96: slot0[0] as bigint,
        tick: Number(slot0[1]),
        liquidity: liquidity as bigint,
      });
    } catch (error) {
      console.error(error);
      setLookupResult(null);
    }
  };

  return {
    // clients
    walletClient,
    publicClient,
    walletAddress,
    isConnected,
    // registry
    registry,
    resolvedAddresses,
    addressOverrides,
    setAddressOverrides,
    showOverrides,
    setShowOverrides,
    poolManagerAddress,
    positionManagerAddress,
    stateViewAddress,
    permit2Address,
    // code
    code,
    setCode,
    // hook
    selectedHookArtifact,
    hookAddress,
    hookFactoryAddress,
    setHookFactoryAddress,
    isMining,
    minedSalt,
    predictedHook,
    hookDeploying,
    initCode,
    initCodeHash,
    canDeployHook,
    handleDeployHookFactory,
    handleMineSalt,
    handleDeployHook,
    handlePrepareAndDeployHook,
    // pool
    poolKey,
    poolId,
    initialPrice,
    setInitialPrice,
    sqrtPriceX96,
    poolInitStatus,
    handleInitializePool,
    // tokens
    token0Decimals,
    token1Decimals,
    // liquidity
    amount0Input,
    setAmount0Input,
    amount1Input,
    setAmount1Input,
    slippageBps,
    setSlippageBps,
    liquidityStatus,
    handleAddLiquidity,
    handleApproveToken,
    // swap
    swapRouterAddress,
    setSwapRouterAddress,
    swapAmount,
    setSwapAmount,
    swapZeroForOne,
    setSwapZeroForOne,
    swapStatus,
    swapApprovalStatus,
    handleDeploySwapRouter,
    handleApproveSwapToken,
    handleSwap,
    // metrics
    metrics,
    refreshMetrics,
    // lookup
    lookup,
    setLookup,
    lookupResult,
    handleLookup,
    // helpers
    formatUnits,
    buildPoolKey,
  };
}

export type ExecuteStepState = ReturnType<typeof useExecuteStep>;
