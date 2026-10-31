export const instant = false;
import { getSession } from "@/lib/get-session";
import { TrainerMainDashboard } from "@/components/trainer/trainer-main-dashboard";

export default async function TrainerDashboard() {
  const session = await getSession();
  return <TrainerMainDashboard userName={session?.user.name ?? "Profesora"} />;
}
