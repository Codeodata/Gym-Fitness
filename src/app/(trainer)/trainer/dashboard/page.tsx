export const instant = false;
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { TrainerMainDashboard } from "@/components/trainer/trainer-main-dashboard";

export default async function TrainerDashboard() {
  const session = await auth.api.getSession({ headers: await headers() });
  return <TrainerMainDashboard userName={session?.user.name ?? "Profesora"} />;
}
