import { cookies } from "next/headers";
import { todayISO } from "./dates";

export async function serverToday(): Promise<string> {
  const tz = (await cookies()).get("tz")?.value;
  return todayISO(tz ? decodeURIComponent(tz) : undefined);
}
