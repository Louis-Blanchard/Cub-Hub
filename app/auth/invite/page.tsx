
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";

export default function InvitePage() {
  const router = useRouter();
  const [message, setMessage] = useState(
    "Confirming your coach invitation..."
  );

  useEffect(() => {
    async function handleInvitation() {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const hash = new URLSearchParams(
        window.location.hash.substring(1)
      );

      const accessToken = hash.get("access_token");
      const refreshToken = hash.get("refresh_token");
      const type = hash.get("type");

      if (
        !accessToken ||
        !refreshToken ||
        type !== "invite"
      ) {
        setMessage(
          "This invitation link is invalid or has expired."
        );
        return;
      }

      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });

      if (error) {
        setMessage(
          "Unable to confirm your invitation. Please request a new invitation."
        );
        return;
      }

      // Remove the tokens from the browser address.
      window.history.replaceState(
        null,
        "",
        "/auth/invite"
      );

      router.replace("/set-password");
      router.refresh();
    }

    handleInvitation();
  }, [router]);

  return (
    <main className="wrap section">
      <h1>Coach Invitation</h1>
      <p role="status">{message}</p>
    </main>
  );
}
