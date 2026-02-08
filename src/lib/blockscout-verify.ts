import type { Address } from "viem";

const SOL_SOURCES = import.meta.glob("../../contracts/**/*.sol", { as: "raw" });

async function resolveSources(sourceKeys: string[]) {
  const sources: Record<string, { content: string }> = {};
  for (const key of sourceKeys) {
    const rel = `../../contracts/${key}`;
    const loader = SOL_SOURCES[rel];
    if (!loader) {
      throw new Error(`Missing source content for ${key}`);
    }
    const content = await loader();
    sources[key] = { content };
  }
  return sources;
}

export async function buildStandardJsonInput(metadata: {
  language: string;
  settings: Record<string, unknown>;
  sources: Record<string, unknown>;
}) {
  const sourceKeys = Object.keys(metadata.sources || {});
  const sources = await resolveSources(sourceKeys);
  return {
    language: metadata.language,
    sources,
    settings: metadata.settings,
  };
}

export async function verifyOnBlockscout(args: {
  baseUrl: string;
  address: Address;
  contractName: string;
  sourceName: string;
  compilerVersion: string;
  input: Record<string, unknown>;
}) {
  const form = new FormData();
  form.append("compiler_version", `v${args.compilerVersion}`);
  const fullName = `${args.sourceName}:${args.contractName}`;
  form.append("contract_name", fullName);
  form.append("file_name", args.sourceName);
  const inputBlob = new Blob([JSON.stringify(args.input)], {
    type: "application/json",
  });
  form.append("files[0]", inputBlob, "input.json");
  form.append("autodetect_constructor_args", "true");

  const res = await fetch(
    `${args.baseUrl}/api/v2/smart-contracts/${args.address}/verification/via/standard-input`,
    {
      method: "POST",
      body: form,
    },
  );

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      data?.message || data?.error || `Verification failed (${res.status})`;
    throw new Error(message);
  }
  return data;
}
