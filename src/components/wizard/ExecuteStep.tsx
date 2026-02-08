import Editor from "@monaco-editor/react";
import { ConnectButton } from "@rainbow-me/rainbowkit";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";

import type { HookFlags, AuditedHook } from "@/lib/hook-registry";
import type { PoolConfig } from "@/components/wizard/PoolSelectStep";
import { isV4Supported } from "@/lib/uniswap-v4-registry";
import { ZERO_ADDRESS } from "@/lib/uniswap-v4-utils";

import { useExecuteStep } from "@/hooks/useExecuteStep";

import {
  CheckCircle2,
  FileCode,
  Info,
  Loader2,
  RefreshCw,
  Rocket,
  Send,
  Settings2,
  Wallet,
} from "lucide-react";

interface ExecuteStepProps {
  poolConfig: PoolConfig;
  flags: HookFlags;
  agentPrompt: string;
  deployChoice: "existing" | "custom" | null;
  auditedHook: AuditedHook | null;
  deployedAddress: string | null;
  onDeployedAddressChange: (address: string | null) => void;
}

export function ExecuteStep({
  poolConfig,
  flags,
  agentPrompt,
  deployChoice,
  auditedHook,
  deployedAddress,
  onDeployedAddressChange,
}: ExecuteStepProps) {
  const {
    walletClient,
    walletAddress,
    isConnected,
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
    code,
    selectedHookArtifact,
    hookAddress,
    isMining,
    minedSalt,
    predictedHook,
    hookDeploying,
    initCode,
    initCodeHash,
    handleMineSalt,
    handleDeployHook,
    handlePrepareAndDeployHook,
    poolKey,
    poolId,
    initialPrice,
    setInitialPrice,
    sqrtPriceX96,
    poolInitStatus,
    handleInitializePool,
    amount0Input,
    setAmount0Input,
    amount1Input,
    setAmount1Input,
    slippageBps,
    setSlippageBps,
    liquidityStatus,
    handleAddLiquidity,
    handleApproveToken,
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
    metrics,
    refreshMetrics,
    token0Meta,
    token1Meta,
    txHistory,
    verification,
    lookup,
    setLookup,
    lookupResult,
    handleLookup,
  } = useExecuteStep({
    poolConfig,
    flags,
    agentPrompt,
    deployChoice,
    auditedHook,
    deployedAddress,
    onDeployedAddressChange,
  });
  return (
    <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-6">
      <Card className="border-primary/30 cyber-glow">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-primary">
            <Send className="w-5 h-5" />
            Deploy & Manage
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs defaultValue="deploy" className="w-full">
            <TabsList className="grid grid-cols-4">
              <TabsTrigger value="deploy">Deploy</TabsTrigger>
              <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
              <TabsTrigger value="swap">Swap</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="deploy" className="space-y-6 pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Latest Transactions</p>
                </div>
                {txHistory.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No transactions yet. Deploy or initialize to see hashes here.
                  </p>
                ) : (
                  <div className="space-y-2 text-xs">
                    {txHistory.slice(0, 6).map((tx) => (
                      <div
                        key={`${tx.label}-${tx.hash}`}
                        className="p-3 rounded-lg bg-muted/40 flex flex-col gap-1"
                      >
                        <span className="font-semibold">{tx.label}</span>
                        <span className="font-mono break-all">{tx.hash}</span>
                        {registry?.blockscout && (
                          <a
                            className="text-primary underline break-all"
                            href={`${registry.blockscout}/tx/${tx.hash}`}
                            target="_blank"
                            rel="noreferrer"
                          >
                            View on Blockscout
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-muted-foreground" />
                  <p className="text-sm font-semibold">Registry Addresses</p>
                  {isV4Supported(poolConfig.chainId) ? (
                    <Badge variant="secondary">v4 ready</Badge>
                  ) : (
                    <Badge variant="outline">custom</Badge>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2 text-xs">
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-muted-foreground">PoolManager</p>
                    <p className="font-mono break-all">
                      {resolvedAddresses.poolManager || "-"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-muted-foreground">PositionManager</p>
                    <p className="font-mono break-all">
                      {resolvedAddresses.positionManager || "-"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-muted-foreground">StateView</p>
                    <p className="font-mono break-all">
                      {resolvedAddresses.stateView || "-"}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40">
                    <p className="text-muted-foreground">Permit2</p>
                    <p className="font-mono break-all">
                      {resolvedAddresses.permit2 || "-"}
                    </p>
                  </div>
                </div>
                {!isV4Supported(poolConfig.chainId) && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    This chain is not in the v4 registry. Provide custom
                    addresses below.
                  </p>
                )}
                {!isV4Supported(poolConfig.chainId) && (
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowOverrides((prev) => !prev)}
                    >
                      {showOverrides
                        ? "Hide Advanced Overrides"
                        : "Advanced Overrides"}
                    </Button>
                  </div>
                )}
                {showOverrides && !isV4Supported(poolConfig.chainId) && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label className="text-xs">PoolManager</Label>
                      <Input
                        value={addressOverrides.poolManager}
                        onChange={(e) =>
                          setAddressOverrides((prev) => ({
                            ...prev,
                            poolManager: e.target.value,
                          }))
                        }
                        className="font-mono text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">PositionManager</Label>
                      <Input
                        value={addressOverrides.positionManager}
                        onChange={(e) =>
                          setAddressOverrides((prev) => ({
                            ...prev,
                            positionManager: e.target.value,
                          }))
                        }
                        className="font-mono text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">StateView</Label>
                      <Input
                        value={addressOverrides.stateView}
                        onChange={(e) =>
                          setAddressOverrides((prev) => ({
                            ...prev,
                            stateView: e.target.value,
                          }))
                        }
                        className="font-mono text-xs"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Permit2</Label>
                      <Input
                        value={addressOverrides.permit2}
                        onChange={(e) =>
                          setAddressOverrides((prev) => ({
                            ...prev,
                            permit2: e.target.value,
                          }))
                        }
                        className="font-mono text-xs"
                      />
                    </div>
                  </div>
                )}
                {registry?.notes && (
                  <p className="text-xs text-muted-foreground flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    {registry.notes}
                  </p>
                )}
              </div>

              {deployChoice === "custom" && selectedHookArtifact && (
                <div className="space-y-3 border-t border-border/60 pt-4">
                <div className="flex items-center gap-2">
                  <Rocket className="w-4 h-4 text-secondary" />
                  <p className="text-sm font-semibold">Hook Deployment</p>
                </div>
                  <p className="text-xs text-muted-foreground">
                    Hook addresses must include the v4 permission flags. We
                    handle the factory + salt mining automatically.
                  </p>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={handlePrepareAndDeployHook}
                      disabled={!initCodeHash || hookDeploying || isMining}
                      className="bg-gradient-to-r from-secondary to-accent"
                    >
                      {hookDeploying || isMining ? (
                        <span className="flex items-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" /> Preparing
                          & Deploying
                        </span>
                      ) : (
                        "Prepare + Deploy Hook"
                      )}
                    </Button>
                    {predictedHook && (
                      <div className="p-3 rounded-lg bg-muted/40 text-xs font-mono break-all">
                        Predicted Hook: {predictedHook}
                      </div>
                    )}
                    {minedSalt && (
                      <div className="p-3 rounded-lg bg-muted/40 text-xs font-mono break-all">
                        Salt: {minedSalt}
                      </div>
                    )}
                    {verification.hook && (
                      <p className="text-xs text-muted-foreground">
                        Verification:{" "}
                        {verification.hook.status === "pending" && "pending"}
                        {verification.hook.status === "success" && "verified"}
                        {verification.hook.status === "error" &&
                          `failed (${verification.hook.message})`}
                      </p>
                    )}
                    {verification.hook?.status === "success" &&
                      registry?.blockscout &&
                      hookAddress !== ZERO_ADDRESS && (
                        <a
                          className="text-xs text-primary underline break-all"
                          href={`${registry.blockscout}/address/${hookAddress}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Verified Contract on Blockscout
                        </a>
                      )}
                  </div>
                </div>
              )}

              {deployChoice === "existing" && auditedHook && (
                <div className="space-y-3 border-t border-border/60 pt-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <p className="text-sm font-semibold">
                      Audited Hook Selected
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/40 text-xs font-mono break-all">
                    {auditedHook.name}: {auditedHook.address}
                  </div>
                </div>
              )}

              <div className="space-y-3 border-t border-border/60 pt-4">
                <div className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-primary" />
                  <p className="text-sm font-semibold">Initialize Pool</p>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <Label className="text-xs">
                      Initial Price (token1 per token0)
                    </Label>
                    <Input
                      value={initialPrice}
                      onChange={(e) => setInitialPrice(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">SqrtPriceX96</Label>
                    <Input
                      value={sqrtPriceX96 ? sqrtPriceX96.toString() : ""}
                      readOnly
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 text-xs font-mono break-all">
                  Hook Address: {hookAddress}
                </div>
                <Button
                  onClick={handleInitializePool}
                  disabled={!walletClient || !sqrtPriceX96 || !poolKey}
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  Initialize Pool
                </Button>
                {poolInitStatus === "success" && (
                  <p className="text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Pool initialized
                  </p>
                )}
                {poolInitStatus === "error" && (
                  <p className="text-xs text-destructive">
                    Pool initialization failed.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="liquidity" className="space-y-6 pt-4">
              <div className="space-y-3">
                <p className="text-sm font-semibold">
                  Approve Tokens (Permit2)
                </p>
                <div className="grid gap-2 md:grid-cols-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      poolKey &&
                      handleApproveToken(
                        poolKey.currency0,
                        positionManagerAddress,
                      )
                    }
                  >
                    Approve Token0
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      poolKey &&
                      handleApproveToken(
                        poolKey.currency1,
                        positionManagerAddress,
                      )
                    }
                  >
                    Approve Token1
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">
                  Add Full-Range Liquidity
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <Label className="text-xs">Amount Token0</Label>
                    <Input
                      value={amount0Input}
                      onChange={(e) => setAmount0Input(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Amount Token1</Label>
                    <Input
                      value={amount1Input}
                      onChange={(e) => setAmount1Input(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Slippage (bps)</Label>
                    <Input
                      value={slippageBps}
                      onChange={(e) => setSlippageBps(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
                <Button
                  onClick={handleAddLiquidity}
                  disabled={
                    !walletClient || !poolKey || !amount0Input || !amount1Input
                  }
                  className="bg-gradient-to-r from-primary to-secondary"
                >
                  Add Liquidity
                </Button>
                {liquidityStatus === "success" && (
                  <p className="text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Liquidity added
                  </p>
                )}
                {liquidityStatus === "error" && (
                  <p className="text-xs text-destructive">
                    Liquidity addition failed.
                  </p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="swap" className="space-y-6 pt-4">
              <div className="space-y-3">
                <p className="text-sm font-semibold">Swap Router</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <Input
                    value={swapRouterAddress}
                    onChange={(e) => setSwapRouterAddress(e.target.value)}
                    placeholder="Swap router address"
                    className="font-mono text-xs"
                  />
                  <Button variant="outline" onClick={handleDeploySwapRouter}>
                    Deploy Simple Router
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Approve Tokens for Swap</p>
                <div className="grid gap-2 md:grid-cols-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      poolKey && handleApproveSwapToken(poolKey.currency0)
                    }
                    disabled={!swapRouterAddress}
                  >
                    Approve Token0
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      poolKey && handleApproveSwapToken(poolKey.currency1)
                    }
                    disabled={!swapRouterAddress}
                  >
                    Approve Token1
                  </Button>
                </div>
                {swapApprovalStatus === "success" && (
                  <p className="text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Swap approvals set
                  </p>
                )}
                {swapApprovalStatus === "error" && (
                  <p className="text-xs text-destructive">
                    Swap approval failed.
                  </p>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Swap Exact In</p>
                <div className="grid gap-3 md:grid-cols-3">
                  <div>
                    <Label className="text-xs">Amount In</Label>
                    <Input
                      value={swapAmount}
                      onChange={(e) => setSwapAmount(e.target.value)}
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="flex items-end gap-2">
                    <Button
                      variant={swapZeroForOne ? "default" : "outline"}
                      onClick={() => setSwapZeroForOne(true)}
                    >
                      0 → 1
                    </Button>
                    <Button
                      variant={!swapZeroForOne ? "default" : "outline"}
                      onClick={() => setSwapZeroForOne(false)}
                    >
                      1 → 0
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleSwap}
                  disabled={!walletClient || !swapRouterAddress || !swapAmount}
                  className="bg-gradient-to-r from-secondary to-accent"
                >
                  Execute Swap
                </Button>
                {swapStatus === "success" && (
                  <p className="text-xs text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Swap executed
                  </p>
                )}
                {swapStatus === "error" && (
                  <p className="text-xs text-destructive">Swap failed.</p>
                )}
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-6 pt-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">Pool & Hook Metrics</p>
                <Button variant="outline" size="sm" onClick={refreshMetrics}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Refresh
                </Button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="p-3 rounded-lg bg-muted/40 text-xs">
                  <p className="text-muted-foreground">Pool Id</p>
                  <p className="font-mono break-all">{poolId ?? "-"}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 text-xs">
                  <p className="text-muted-foreground">Token 0</p>
                  <p className="font-mono break-all">
                    {token0Meta.name} ({token0Meta.symbol}) [token0]
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 text-xs">
                  <p className="text-muted-foreground">Token 1</p>
                  <p className="font-mono break-all">
                    {token1Meta.name} ({token1Meta.symbol}) [token1]
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 text-xs">
                  <p className="text-muted-foreground">Current Tick</p>
                  <p className="font-mono">{metrics.tick ?? "-"}</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/40 text-xs">
                  <p className="text-muted-foreground">Liquidity</p>
                  <p className="font-mono">
                    {metrics.liquidity?.toString() ?? "-"}
                  </p>
                </div>
                {flags.feeThreshold && (
                  <>
                    <div className="p-3 rounded-lg bg-muted/40 text-xs">
                      <p className="text-muted-foreground">Fees Collected</p>
                      <p className="font-mono">
                        {metrics.feesCollected?.toString() ?? "-"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 text-xs">
                      <p className="text-muted-foreground">Fees Distributed</p>
                      <p className="font-mono">
                        {metrics.feesDistributed?.toString() ?? "-"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 text-xs">
                      <p className="text-muted-foreground">Fees Pending</p>
                      <p className="font-mono">
                        {metrics.feesAccrued?.toString() ?? "-"}
                      </p>
                    </div>
                  </>
                )}
                {flags.limitOrders && (
                  <div className="p-3 rounded-lg bg-muted/40 text-xs">
                    <p className="text-muted-foreground">Orders Executed</p>
                    <p className="font-mono">
                      {metrics.executedOrders?.toString() ?? "-"}
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <p className="text-sm font-semibold">Pool Lookup</p>
                <div className="grid gap-3 md:grid-cols-2">
                  <Input
                    placeholder="Token A"
                    value={lookup.tokenA}
                    onChange={(e) =>
                      setLookup((prev) => ({ ...prev, tokenA: e.target.value }))
                    }
                    className="font-mono text-xs"
                  />
                  <Input
                    placeholder="Token B"
                    value={lookup.tokenB}
                    onChange={(e) =>
                      setLookup((prev) => ({ ...prev, tokenB: e.target.value }))
                    }
                    className="font-mono text-xs"
                  />
                  <Input
                    placeholder="Fee"
                    value={lookup.fee}
                    onChange={(e) =>
                      setLookup((prev) => ({ ...prev, fee: e.target.value }))
                    }
                    className="font-mono text-xs"
                  />
                  <Input
                    placeholder="Tick Spacing"
                    value={lookup.tickSpacing}
                    onChange={(e) =>
                      setLookup((prev) => ({
                        ...prev,
                        tickSpacing: e.target.value,
                      }))
                    }
                    className="font-mono text-xs"
                  />
                  <Input
                    placeholder="Hook Address"
                    value={lookup.hook}
                    onChange={(e) =>
                      setLookup((prev) => ({ ...prev, hook: e.target.value }))
                    }
                    className="font-mono text-xs"
                  />
                </div>
                <Button variant="outline" onClick={handleLookup}>
                  Compute Pool Id
                </Button>
                {lookup.poolId && (
                  <div className="p-3 rounded-lg bg-muted/40 text-xs font-mono break-all">
                    {lookup.poolId}
                  </div>
                )}
                {lookupResult && (
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="p-3 rounded-lg bg-muted/40 text-xs">
                      <p className="text-muted-foreground">Tick</p>
                      <p className="font-mono">{lookupResult.tick ?? "-"}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 text-xs">
                      <p className="text-muted-foreground">Liquidity</p>
                      <p className="font-mono">
                        {lookupResult.liquidity?.toString() ?? "-"}
                      </p>
                    </div>
                    <div className="p-3 rounded-lg bg-muted/40 text-xs">
                      <p className="text-muted-foreground">SqrtPriceX96</p>
                      <p className="font-mono break-all">
                        {lookupResult.sqrtPriceX96?.toString() ?? "-"}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <div className="pt-4 border-t border-border">
            {isConnected ? (
              <Badge variant="secondary" className="text-xs">
                Connected as {walletAddress?.slice(0, 6)}...
                {walletAddress?.slice(-4)}
              </Badge>
            ) : (
              <ConnectButton.Custom>
                {({ openConnectModal, mounted }) => (
                  <Button
                    onClick={openConnectModal}
                    disabled={!mounted}
                    className="w-full bg-gradient-to-r from-secondary to-accent"
                  >
                    <Wallet className="w-4 h-4 mr-2" />
                    Connect Wallet to Execute
                  </Button>
                )}
              </ConnectButton.Custom>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="border-secondary/30 cyber-glow-purple overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-secondary">
            <FileCode className="w-5 h-5" />
            Hook Solidity Code
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 h-[720px]">
          <Editor
            height="100%"
            language="sol"
            theme="vs-dark"
            value={code}
            options={{
              readOnly: true,
              minimap: { enabled: false },
              fontSize: 12,
              lineNumbers: "on",
              scrollBeyondLastLine: false,
              wordWrap: "on",
              padding: { top: 16, bottom: 16 },
            }}
          />
        </CardContent>
      </Card>
    </div>
  );
}
