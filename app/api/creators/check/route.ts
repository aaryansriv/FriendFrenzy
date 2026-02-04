import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const name = request.nextUrl.searchParams.get('name');

    if (!name) {
        return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    try {
        const supabase = getSupabase();
        const { data, error } = await supabase
            .from('creators')
            .select('id')
            .eq('name', name.trim())
            .maybeSingle();

        if (error) throw error;

        return NextResponse.json({
            exists: !!data,
            available: !data
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
