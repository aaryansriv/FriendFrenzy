import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

// Helper to verify admin token
async function verifyAdmin(id: string, token: string | null) {
    if (!token) return false;
    const supabase = getSupabase();
    const { data, error } = await supabase
        .from('polls')
        .select('admin_token')
        .eq('id', id)
        .single();

    return data?.admin_token === token;
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const { adminToken, action } = await request.json();

        if (!(await verifyAdmin(id, adminToken))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabase();

        if (action === 'close') {
            const { error } = await supabase
                .from('polls')
                .update({ status: 'closed' })
                .eq('id', id);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'open') {
            const { error } = await supabase
                .from('polls')
                .update({ status: 'active' })
                .eq('id', id);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        if (action === 'extend') {
            const { error } = await supabase
                .from('polls')
                .update({ expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() })
                .eq('id', id);
            if (error) throw error;
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const adminToken = request.nextUrl.searchParams.get('token');

        if (!(await verifyAdmin(id, adminToken))) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const supabase = getSupabase();
        const { error } = await supabase.from('polls').delete().eq('id', id);
        if (error) throw error;

        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
