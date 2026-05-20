import { getAuthenticatedUser, createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ProfileView } from "./profile-view";

export default async function Profile() {
  const user = await getAuthenticatedUser();

  if (!user) {
    redirect("/login");
  }

  const handleSignOut = async () => {
    "use server";
    
    // 1. Clear Demo session cookie
    const cookieStore = await cookies();
    cookieStore.set("passam_demo_session", "", {
      path: "/",
      maxAge: -1, // Expire instantly
    });

    // 2. Sign out of Supabase
    const supabase = await createClient();
    await supabase.auth.signOut();

    // Redirect to login portal
    redirect("/login");
  };

  return (
    <div className="p-6 md:p-8 space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto">
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight">Profile & Settings</h1>
          <p className="text-muted-foreground text-sm font-medium mt-1">Manage your university details, academic target, and offline cache.</p>
        </div>
      </div>

      <ProfileView user={user} signOutAction={handleSignOut} />
    </div>
  );
}
