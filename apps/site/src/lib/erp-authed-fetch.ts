import { cookies } from "next/headers";
import { erpFetch, ErpError, type ErpFetchOptions } from "@/lib/erp-client";
import {
  ERP_REFRESH_COOKIE,
  ERP_TOKEN_COOKIE,
  erpCookieOptions,
  refreshErpTokens,
} from "@/lib/erp-session";

/**
 * erpFetch with the signed-in user's ERP token, retrying once after a 401
 * by rotating the refresh cookie. Cookie writes only succeed inside route
 * handlers / server actions; in server components the write throws, so we
 * skip the retry there (proxy.ts already refreshed before render) rather
 * than rotate a refresh token we can't persist.
 */
export async function erpFetchAsUser<T>(
  opts: Omit<ErpFetchOptions, "token">,
  token: string,
): Promise<T> {
  try {
    return await erpFetch<T>({ ...opts, token });
  } catch (error) {
    if (!(error instanceof ErpError) || error.status !== 401) throw error;
    const jar = await cookies();
    const refresh = jar.get(ERP_REFRESH_COOKIE)?.value;
    if (!refresh) throw error;
    try {
      // Probe writability before spending the single-use refresh token.
      jar.set({ name: ERP_TOKEN_COOKIE, value: token, ...erpCookieOptions });
    } catch {
      throw error;
    }
    const pair = await refreshErpTokens(refresh);
    if (!pair) throw error;
    jar.set({ name: ERP_TOKEN_COOKIE, value: pair.accessToken, ...erpCookieOptions });
    jar.set({ name: ERP_REFRESH_COOKIE, value: pair.refreshToken, ...erpCookieOptions });
    return await erpFetch<T>({ ...opts, token: pair.accessToken });
  }
}
