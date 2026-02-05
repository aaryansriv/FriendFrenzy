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
            .from('poll_ai_reports')
            .select('*')
            .eq('poll_id', id)
            .maybeSingle();

        // 2. If it's already completed and we aren't forcing, return it
        if (report?.status === 'completed' && !force) {
            console.log(`AI_ROUTE: Serving completed report for ${id}`);
            return NextResponse.json(report.insights);
        }

        // 3. If it's processing and we aren't forcing, tell the client to keep polling
        if (report?.status === 'processing' && !force) {
            console.log(`AI_ROUTE: Report for ${id} is still processing...`);
            return NextResponse.json({ status: 'processing', message: 'The AI is cooking...' });
        }

        // 4. Force Generation or Start New Generation
        if (force || !report) {
            console.log(`AI_ROUTE: Starting FRESH generation for poll ${id}`);

            // Immediately mark as processing in DB so other polls don't trigger it
            await supabase.from('poll_ai_reports').upsert({
                poll_id: id,
                status: 'processing',
                updated_at: new Date().toISOString()
            });

            // GATHER DATA (Optimized)
            const [pollRes, resultsRes, friendsRes, confessionsRes] = await Promise.all([
                supabase.from('polls').select('status, question_set, creators(name)').eq('id', id).single(),
                supabase.from('results').select('question, friend_id, answer_option, friends(name), vote_count').eq('poll_id', id),
                supabase.from('friends').select('id, name, gender').eq('poll_id', id),
                supabase.from('confessions').select('confession_text').eq('poll_id', id)
            ]);

            if (pollRes.error || !pollRes.data) return NextResponse.json({ error: 'Poll not found' }, { status: 404 });

            try {
                const insights = await generatePollInsights(
                    { ...pollRes.data, creator_name: (pollRes.data as any).creators?.name },
                    resultsRes.data || [],
                    friendsRes.data || [],
                    confessionsRes.data?.map((c: any) => c.confession_text) || []
                );

                const isFallback = insights.friendJudgments.some(j => j.judgment.includes('FALLBACK_GENERATION'));

                if (!isFallback) {
                    console.log(`AI_ROUTE: Successfully generated insights for ${id}. Saving to DB...`);
                    const { error: saveError } = await supabase.from('poll_ai_reports').upsert({
                        poll_id: id,
                        status: 'completed',
                        insights: insights,
                        updated_at: new Date().toISOString()
                    });

                    if (saveError) console.error("AI_ROUTE: DB Save Error:", saveError);
                    return NextResponse.json(insights);
                } else {
                    console.warn(`AI_ROUTE: AI returned fallback for ${id}. Not saving.`);
                    return NextResponse.json(insights);
                }
            } catch (err: any) {
                console.error(`AI_ROUTE: Critical failure for ${id}:`, err);
                await supabase.from('poll_ai_reports').upsert({
                    poll_id: id,
                    status: 'failed',
                    error_message: err.message,
                    updated_at: new Date().toISOString()
                });
                throw err;
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
