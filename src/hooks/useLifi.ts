import { useMemo, useState } from "react";
import { useAccount, usePublicClient, useWalletClient } from "wagmi";
import type { Address } from "viem";

const LIFI_BASE_URL = "https://li.quest/v1";

export interface LifiQuoteResponse {
  transactionRequest?: {
    to: Address;
    data: `0x${string}`;
    value?: string;
    gasLimit?: string;
    gasPrice?: string;
  };
  estimate?: {
    toAmount?: string;
    toAmountMin?: string;
    fromAmount?: string;
  };
  tool?: string;
}

export function useLifi(defaultToAddress?: string) {
  const { address } = useAccount();
  const [fromChainId, setFromChainId] = useState("1");
  const [toChainId, setToChainId] = useState("10");
  const [fromToken, setFromToken] = useState("");
  const [toToken, setToToken] = useState("");
  const [amount, setAmount] = useState("");
  const [toAddress, setToAddress] = useState(defaultToAddress ?? "");
  const [quote, setQuote] = useState<LifiQuoteResponse | null>(null);
  const [status, setStatus] = useState<"idle" | "pending" | "error" | "success">("idle");
  const [error, setError] = useState<string | null>(null);

  const parsedFromChain = Number(fromChainId || "0");
  const parsedToChain = Number(toChainId || "0");

  const { data: walletClient } = useWalletClient({
    chainId: Number.isFinite(parsedFromChain) ? parsedFromChain : undefined,
  });
  const publicClient = usePublicClient({
    chainId: Number.isFinite(parsedFromChain) ? parsedFromChain : undefined,
  });

  const isReady = useMemo(() => {
    return (
      Boolean(address) &&
      Boolean(fromToken) &&
      Boolean(toToken) &&
      Boolean(amount) &&
      Boolean(toAddress) &&
      Number.isFinite(parsedFromChain) &&
      Number.isFinite(parsedToChain)
    );
  }, [address, amount, fromToken, parsedFromChain, parsedToChain, toAddress, toToken]);

  const fetchQuote = async () => {
    setStatus("pending");
    setError(null);
    setQuote(null);
    try {
      if (!isReady) throw new Error("Missing quote parameters");

      const params = new URLSearchParams({
        fromChain: String(parsedFromChain),
        toChain: String(parsedToChain),
        fromToken: fromToken,
        toToken: toToken,
        fromAmount: amount,
        fromAddress: address as string,
        toAddress,
        integrator: "HookWizard",
      });

      console.groupCollapsed("[HookWizard] LI.FI quote");
      console.log(Object.fromEntries(params));
      console.groupEnd();
      const response = await fetch(`${LIFI_BASE_URL}/quote?${params.toString()}`);
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error(body?.message || `Quote failed (${response.status})`);
      }
      const data = (await response.json()) as LifiQuoteResponse;
      console.groupCollapsed("[HookWizard] LI.FI quote response");
      console.log(data);
      console.groupEnd();
      setQuote(data);
      setStatus("success");
      return data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Quote failed";
      setError(message);
      setStatus("error");
      throw err;
    }
  };

  const executeQuote = async () => {
    if (!quote?.transactionRequest) {
      throw new Error("Quote missing transaction request");
    }
    if (!walletClient || !publicClient) {
      throw new Error("Wallet not connected");
    }

    const tx = quote.transactionRequest;
    console.groupCollapsed("[HookWizard] LI.FI execute");
    console.log(tx);
    console.groupEnd();
    const hash = await walletClient.sendTransaction({
      to: tx.to,
      data: tx.data,
      value: tx.value ? BigInt(tx.value) : undefined,
      gas: tx.gasLimit ? BigInt(tx.gasLimit) : undefined,
      gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : undefined,
    });
    await publicClient.waitForTransactionReceipt({ hash });
    return hash;
  };

  return {
    fromChainId,
    setFromChainId,
    toChainId,
    setToChainId,
    fromToken,
    setFromToken,
    toToken,
    setToToken,
    amount,
    setAmount,
    toAddress,
    setToAddress,
    quote,
    status,
    error,
    isReady,
    fetchQuote,
    executeQuote,
  };
}
