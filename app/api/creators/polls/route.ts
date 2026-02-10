import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(request: NextRequest) {
    const { userId } = await auth();

    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    try {
        const user = await currentUser();
        const email = user?.primaryEmailAddress?.emailAddress;

        const supabase = getSupabase();

        // 1. Find ALL creator records by clerk_id OR email
        let query = supabase.from('creators').select('id, clerk_id, email');

        if (email) {
            query = query.or(`clerk_id.eq.${userId},email.eq.${email}`);
        } else {
            query = query.eq('clerk_id', userId);
        }

        const { data: dbCreators } = await query;

        if (!dbCreators || dbCreators.length === 0) {
            return NextResponse.json({ polls: [] });
        }

        const creatorIds = dbCreators.map((c: any) => c.id);

        // 1.5 Auto-link clerk_id if missing for any of these records
        const unlinkedCreators = dbCreators.filter((c: any) => !c.clerk_id);
        if (unlinkedCreators.length > 0 && userId) {
            await supabase
                .from('creators')
                .update({ clerk_id: userId })
                .in('id', unlinkedCreators.map((c: any) => c.id));
        }

        // 2. Find polls for all these creator records
        const { data: polls, error } = await supabase
            .from('polls')
            .select('id, status, question_set, created_at, admin_token, poll_name')
            .in('creator_id', creatorIds)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ polls: polls || [] });
    } catch (error: any) {
        console.error('Failed to fetch user polls:', error);
        return NextResponse.json({ error: 'Failed to fetch polls' }, { status: 500 });
    }
}
