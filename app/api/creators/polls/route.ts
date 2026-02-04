import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const email = request.nextUrl.searchParams.get('email');

    if (!email) {
        return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    try {
        const supabase = getSupabase();

        // 1. Find creator by email
        const { data: creator } = await supabase
            .from('creators')
            .select('id')
            .eq('email', email.trim())
            .maybeSingle();


        if (!creator) {
            return NextResponse.json({ polls: [] });
        }

        // 2. Find polls for this creator
        const { data: polls, error } = await supabase
            .from('polls')
            .select('id, status, question_set, created_at, admin_token')
            .eq('creator_id', creator.id)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ polls: polls || [] });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
