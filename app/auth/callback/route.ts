
import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '../../../lib/supabase';
import type { EmailOtpType } from '@supabase/supabase-js';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);

  const code = url.searchParams.get('code');
  const tokenHash = url.searchParams.get('token_hash');
  const type = url.searchParams.get('type');

  const supabase = await supabaseServer();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL('/portal', url.origin));
    }

    console.error('Auth code exchange failed:', error.message);
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: type as EmailOtpType,
    });

    if (!error) {
      return NextResponse.redirect(new URL('/portal', url.origin));
    }

    console.error('OTP verification failed:', error.message);
  }

  return NextResponse.redirect(
    new URL('/login?error=authentication_failed', url.origin)
  );
}
