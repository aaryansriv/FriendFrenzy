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

        // 1. Check current status in our new tracking table
        const { data: report } = await supabase
            .from('poll_ai_insights')
            .select('*')
            .eq('poll_id', id)
            .maybeSingle();

        const insights = report?.insights;

        // 2. If it's already completed and we aren't forcing, return it
        if (insights?.status === 'completed' && !force) {
            console.log(`AI_ROUTE: Serving completed insights for ${id}`);
            return NextResponse.json(insights);
        }

        // 3. If it's processing and we aren't forcing, tell the client to keep polling
        if (insights?.status === 'processing' && !force) {
            console.log(`AI_ROUTE: Report for ${id} is still processing...`);
            return NextResponse.json(insights);
        }

        // 4. Force Generation or Start New Generation
        if (force || !report) {
            console.log(`AI_ROUTE: Starting FRESH generation for poll ${id}`);

            // Immediately mark as processing in DB
            await supabase.from('poll_ai_insights').upsert({
                poll_id: id,
                insights: { status: 'processing', message: 'The AI is cooking...' },
                updated_at: new Date().toISOString()
            }, { onConflict: 'poll_id' });

            try {
                // GATHER DATA
                console.log(`AI_ROUTE: Gathering poll data for ${id}...`);
                const [pollRes, resultsRes, friendsRes, confessionsRes] = await Promise.all([
                    supabase.from('polls').select('status, question_set, creators(name)').eq('id', id).single(),
                    supabase.from('results').select('question, friend_id, answer_option, friends(name), vote_count').eq('poll_id', id),
                    supabase.from('friends').select('id, name, gender').eq('poll_id', id),
                    supabase.from('confessions').select('confession_text').eq('poll_id', id)
                ]);

                if (pollRes.error || !pollRes.data) throw new Error(pollRes.error?.message || 'Poll data missing');
                if (resultsRes.error) throw new Error(`Results query failed: ${resultsRes.error.message}`);

                console.log(`AI_ROUTE: Data gathered. Calling AI Service...`);
                const insights = await generatePollInsights(
                    { ...pollRes.data, creator_name: (pollRes.data as any).creators?.name },
                    resultsRes.data || [],
                    friendsRes.data || [],
                    confessionsRes.data?.map((c: any) => c.confession_text) || []
                );

                const isFallback = insights.friendJudgments.some(j => j.judgment.includes('FALLBACK_GENERATION'));

                if (!isFallback) {
                    console.log(`AI_ROUTE: Success for ${id}. Saving 'completed' to DB.`);
                    const finalInsights = { ...insights, status: 'completed' };
                    await supabase.from('poll_ai_insights').upsert({
                        poll_id: id,
                        insights: finalInsights,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'poll_id' });
                    return NextResponse.json(finalInsights);
                } else {
                    console.warn(`AI_ROUTE: AI Fallback for ${id}. Saving 'failed' to DB.`);
                    const fallbackData = { ...insights, status: 'failed' };
                    await supabase.from('poll_ai_insights').upsert({
                        poll_id: id,
                        insights: fallbackData,
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'poll_id' });
                    return NextResponse.json(fallbackData);
                }
            } catch (err: any) {
                console.error(`AI_ROUTE: Generation error for ${id}:`, err);
                const errorData = { status: 'failed', error: err.message };
                await supabase.from('poll_ai_insights').upsert({
                    poll_id: id,
                    insights: errorData,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'poll_id' });
                return NextResponse.json(errorData, { status: 500 });
            }
        }

        return NextResponse.json({ status: 'processing' });

    } catch (error: any) {
        console.error('AI Insights Route Error:', error);
        return NextResponse.json(
            { error: 'Failed to process AI insights', details: error.message },
            { status: 500 }
        );
    }
}
