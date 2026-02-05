// app/api/polls/[id]/ai-insights/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { generatePollInsights } from '@/lib/ai-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = getSupabase();
        const force = request.nextUrl.searchParams.get('force') === 'true';

        console.log(`AI_ROUTE: Fetching insights for poll ${id} (force: ${force})`);

        if (!process.env.OPENROUTER_API_KEY) {
            console.error("AI_ROUTE: OPENROUTER_API_KEY is missing from environment variables!");
        }

        if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("AI_ROUTE: SUPABASE_SERVICE_ROLE_KEY is missing! Site data queries will fail.");
        }

        // 1. Check if insights already exist (unless forced)
        if (!force) {
            const { data: existingInsights } = await supabase
                .from('poll_ai_insights')
                .select('insights')
                .eq('poll_id', id)
                .maybeSingle();

            if (existingInsights && existingInsights.insights) {
                const insights = existingInsights.insights;
                // Check if the cached results are fallback results
                const isCachedFallback = (insights as any).friendJudgments?.some((j: any) =>
                    j.judgment.includes('FALLBACK_GENERATION')
                );

                if (!isCachedFallback) {
                    console.log(`AI_ROUTE: Serving cached insights for ${id}`);
                    return NextResponse.json(insights);
                }
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
        console.log(`AI_ROUTE: Generating fresh insights for poll ${id}...`);
        const insights = await generatePollInsights(
            { ...poll, creator_name: (poll as any).creators?.name },
            results || [],
            friends || [],
            confessions?.map((c: { confession_text: string }) => c.confession_text) || []
        );

        // 5. Cache insights in Supabase - ONLY if not a fallback
        const isFallback = insights.friendJudgments.some(j => j.judgment.includes('FALLBACK_GENERATION'));

        if (!isFallback) {
            console.log(`AI_ROUTE: Caching fresh insights for ${id}`);
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
