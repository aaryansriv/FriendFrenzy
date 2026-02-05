// app/api/polls/[id]/ai-insights/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { generatePollInsights } from '@/lib/ai-service';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = getSupabase();
        const force = request.nextUrl.searchParams.get('force') === 'true';

        // 1. Check if insights already exist (unless forced)
        if (!force) {
            const { data: existingInsights, error: fetchError } = await supabase
                .from('poll_ai_insights')
                .select('insights')
                .eq('poll_id', id)
                .maybeSingle();

            if (existingInsights && existingInsights.insights) {
                // If it looks like a fallback, and NOT forced, we still serve it,
                // BUT the reason you see generic might be because it was CACHED as fallback.
                return NextResponse.json(existingInsights.insights);
            }
        }

        // 2. check if the poll is closed
        const { data: poll, error: pollError } = await supabase
            .from('polls')
            .select('status, question_set, creators(name)')
            .eq('id', id)
            .single();

        if (pollError || !poll) {
            return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
        }

        // AI only runs for closed polls
        if (poll.status !== 'closed') {
            return NextResponse.json({
                message: 'Poll is still active. AI insights are generated once the poll is closed.',
                isClosed: false
            });
        }

        // 3. Gather data for AI
        const { data: results, error: resultsError } = await supabase
            .from('results')
            .select('question, friend_id, answer_option, friends(name), vote_count')
            .eq('poll_id', id);

        const { data: friends, error: friendsError } = await supabase
            .from('friends')
            .select('id, name, gender')
            .eq('poll_id', id);

        const { data: confessions, error: confessionsError } = await supabase
            .from('confessions')
            .select('confession_text')
            .eq('poll_id', id);

        if (resultsError || friendsError || confessionsError) throw new Error('Failed to gather poll data');

        // 4. Generate AI Insights
        const insights = await generatePollInsights(
            { ...poll, creator_name: (poll as any).creators?.name },
            results || [],
            friends || [],
            confessions?.map((c: { confession_text: string }) => c.confession_text) || []
        );

        // 5. Cache insights in Supabase - ONLY if not a fallback
        const isFallback = insights.friendJudgments.some(j => j.judgment.includes('somehow avoided attention') || j.judgment.includes('total mystery'));

        if (!isFallback) {
            const { error: insertError } = await supabase
                .from('poll_ai_insights')
                .upsert({
                    poll_id: id,
                    insights: insights
                }, { onConflict: 'poll_id' });

            if (insertError) {
                console.error('Failed to cache AI insights:', insertError);
            }
        }

        return NextResponse.json(insights);

    } catch (error: any) {
        console.error('AI Insights Route Error:', error);
        return NextResponse.json(
            { error: 'Failed to process AI insights', details: error.message },
            { status: 500 }
        );
    }
}
