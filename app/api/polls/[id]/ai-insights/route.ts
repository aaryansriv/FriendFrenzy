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

        // 1. Check if insights already exist
        const { data: existingInsights } = await supabase
            .from('poll_ai_insights')
            .select('insights')
            .eq('poll_id', id)
            .maybeSingle();

        if (existingInsights && existingInsights.insights) {
            const insights = existingInsights.insights;
            const isCachedFallback = (insights as any).friendJudgments?.some((j: any) =>
                j.judgment.includes('FALLBACK_GENERATION')
            );

            // If we have real insights, or we have fallback but aren't forcing, return them
            if (!isCachedFallback || !force) {
                console.log(`AI_ROUTE: Returning ${isCachedFallback ? 'fallback' : 'real'} insights for ${id}`);
                return NextResponse.json(insights);
            }
        }

        // 2. If no insights exist AND we aren't forcing, return "processing"
        // This is the key fix: Polling should NOT trigger a fresh generation
        if (!force) {
            console.log(`AI_ROUTE: Insights not ready for ${id}, client should keep polling.`);
            return NextResponse.json({
                status: 'processing',
                message: 'AI is still cooking those roasts...'
            });
        }

        // 3. Force Generation Logic (only happens when user clicks button)
        console.log(`AI_ROUTE: Triggering forced AI generation for ${id}`);

        const { data: poll, error: pollError } = await supabase
            .from('polls')
            .select('status, question_set, creators(name)')
            .eq('id', id)
            .single();

        if (pollError || !poll) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
        if (poll.status !== 'closed') return NextResponse.json({ message: 'Poll active', isClosed: false });

        const [results, friends, confessions] = await Promise.all([
            supabase.from('results').select('question, friend_id, answer_option, friends(name), vote_count').eq('poll_id', id),
            supabase.from('friends').select('id, name, gender').eq('poll_id', id),
            supabase.from('confessions').select('confession_text').eq('poll_id', id)
        ]);

        const insights = await generatePollInsights(
            { ...poll, creator_name: (poll as any).creators?.name },
            results.data || [],
            friends.data || [],
            confessions.data?.map((c: any) => c.confession_text) || []
        );

        const isFallback = insights.friendJudgments.some(j => j.judgment.includes('FALLBACK_GENERATION'));

        if (!isFallback) {
            console.log(`AI_ROUTE: Success! Saving real insights to Supabase for ${id}`);
            await supabase.from('poll_ai_insights').upsert({
                poll_id: id,
                insights: insights
            }, { onConflict: 'poll_id' });
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
