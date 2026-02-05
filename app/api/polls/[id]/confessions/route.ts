// app/api/polls/[id]/confessions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { confession } = await request.json();
        const supabase = getSupabase();

        if (!confession || confession.trim().length === 0) {
            return NextResponse.json({ error: 'Confession cannot be empty' }, { status: 400 });
        }

        const { error } = await supabase
            .from('confessions')
            .insert({
                poll_id: id,
                confession_text: confession.trim()
            });

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Confession API Error:', error);
        return NextResponse.json(
            { error: 'Failed to save confession' },
            { status: 500 }
        );
    }
}
