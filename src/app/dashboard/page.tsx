import { getAuthenticatedUser } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import { DashboardClient } from "./dashboard-client";

export default async function Dashboard() {
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect("/login");
  }

  return <DashboardClient user={user} />;
}
