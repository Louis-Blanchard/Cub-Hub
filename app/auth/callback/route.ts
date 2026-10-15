
import { NextRequest, NextResponse } from "next/server";
import { supabaseServer } from "../../../lib/supabase";
import type { EmailOtpType } from "@supabase/supabase-js";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const code = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type");
  const next = url.searchParams.get("next");

  const supabase = await supabaseServer();

  let authenticated = false;

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      authenticated = true;
    } else {
      console.error("Auth code exchange failed:", error.message);
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (!error) {
      authenticated = true;
    } else {
      console.error("OTP verification failed:", error.message);
    }
  }

  if (authenticated) {
    if (type === "invite" || next === "/set-password") {
      return NextResponse.redirect(
        new URL("/set-password", url.origin)
      );
    }

   if (type === "recovery" || next === "/reset-password") {
  const response = NextResponse.redirect(
    new URL("/reset-password", url.origin)
  );

  response.cookies.set("cub_hub_recovery", "verified", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/reset-password",
    maxAge: 600,
  });

  return response;
}

    return NextResponse.redirect(
      new URL("/portal", url.origin)
    );
  }

  return NextResponse.redirect(
    new URL("/login?error=authentication_failed", url.origin)
  );
}
