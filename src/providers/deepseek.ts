import type { ProviderContext, ProviderResult } from "../types";
import { fetchJson } from "../utils/http";
import { formatMoney } from "../utils/format";
import { peakMarker } from "../utils/peak";

interface DeepSeekBalanceResponse {
  is_available?: boolean;
  balance_infos?: Array<{
    currency: string;
    total_balance: string;
    granted_balance?: string;
    topped_up_balance?: string;
  }>;
}

export async function queryDeepSeek(
  context: ProviderContext,
): Promise<ProviderResult> {
  const body = await fetchJson<DeepSeekBalanceResponse>(
    "https://api.deepseek.com/user/balance",
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${context.apiKey}`,
      },
    },
    context.timeoutMs,
  );

  const balance =
    body.balance_infos?.find((item) => item.currency === "CNY")
    ?? body.balance_infos?.[0];

  if (!balance) {
    throw new Error("DeepSeek balance was not returned");
  }

  const marker = peakMarker("deepseek");
  const balanceText = `balance ${formatMoney(balance.total_balance, balance.currency)}`;

  return {
    provider: "deepseek",
    text: marker ? `${balanceText} · ${marker}` : balanceText,
  };
}
