import {NextRequest,NextResponse} from 'next/server';
import {supabaseServer} from '../../../lib/supabase';
export async function GET(request:NextRequest){const url=new URL(request.url);const code=url.searchParams.get('code');if(code){const sb=await supabaseServer();const {error}=await sb.auth.exchangeCodeForSession(code);if(!error)return NextResponse.redirect(new URL('/portal',url.origin))}return NextResponse.redirect(new URL('/login',url.origin))}
