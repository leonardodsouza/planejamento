import { cookies } from "next/headers";
import { DEFAULT_TZ, todayISO } from "./dates";

export async function serverTz(): Promise<string> {
  const tz = (await cookies()).get("tz")?.value;
  const value = tz ? decodeURIComponent(tz) : DEFAULT_TZ;
  try {
    new Intl.DateTimeFormat("en", { timeZone: value });
    return value;
  } catch {
    return DEFAULT_TZ;
  }
}

export async function serverToday(): Promise<string> {
  return todayISO(await serverTz());
}
