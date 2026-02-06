import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { generatePollInsights } from '@/lib/ai-service';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const supabase = getSupabase();
        const force = request.nextUrl.searchParams.get('force') === 'true';

        console.log(`AI_ROUTE: Fetching insights for poll ${id} (force: ${force})`);

        // Check for required environment variables early
        if (!process.env.OPENROUTER_API_KEY || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("AI_ROUTE: Missing API keys in environment!");
            return NextResponse.json(
                { status: 'failed', error: 'Server configuration error: Missing API keys' },
                { status: 500 }
            );
        }

        // 1. Check current status in our tracking table
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
            return NextResponse.json({ status: 'processing', message: 'The AI is cooking...' });
        }

        // 4. Start New Generation (or Force)
        console.log(`AI_ROUTE: Starting EDGE BACKGROUND generation for poll ${id}`);

        // Immediately mark as processing in DB
        const processingData = { status: 'processing', message: 'The AI is cooking...' };
        await supabase.from('poll_ai_insights').upsert({
            poll_id: id,
            insights: processingData,
            updated_at: new Date().toISOString()
        }, { onConflict: 'poll_id' });

        // Use request.waitUntil which is standard for Edge Runtime
        request.waitUntil((async () => {
            try {
                console.log(`AI_BG_EDGE: Gathering poll data for ${id}...`);
                const [pollRes, resultsRes, friendsRes, confessionsRes] = await Promise.all([
                    supabase.from('polls').select('status, question_set, creators(name)').eq('id', id).single(),
                    supabase.from('results').select('question, friend_id, answer_option, friends(name), vote_count').eq('poll_id', id),
                    supabase.from('friends').select('id, name, gender').eq('poll_id', id),
                    supabase.from('confessions').select('confession_text').eq('poll_id', id)
                ]);

                if (pollRes.error || !pollRes.data) throw new Error(pollRes.error?.message || 'Poll data missing');

                console.log(`AI_BG_EDGE: Calling AI Service...`);
                const aiInsights = await generatePollInsights(
                    { ...pollRes.data, creator_name: (pollRes.data as any).creators?.name },
                    resultsRes.data || [],
                    friendsRes.data || [],
                    confessionsRes.data?.map((c: any) => c.confession_text) || []
                );

                const isFallback = aiInsights.friendJudgments.some(j => j.judgment.includes('FALLBACK_GENERATION'));

                if (!isFallback) {
                    console.log(`AI_BG_EDGE: Success for ${id}. Saving 'completed' to DB.`);
                    await supabase.from('poll_ai_insights').upsert({
                        poll_id: id,
                        insights: { ...aiInsights, status: 'completed' },
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'poll_id' });
                } else {
                    console.warn(`AI_BG_EDGE: AI Fallback for ${id}. Saving 'failed' to DB.`);
                    await supabase.from('poll_ai_insights').upsert({
                        poll_id: id,
                        insights: { ...aiInsights, status: 'failed' },
                        updated_at: new Date().toISOString()
                    }, { onConflict: 'poll_id' });
                }
            } catch (err: any) {
                console.error(`AI_BG_EDGE: Generation error for ${id}:`, err);
                await supabase.from('poll_ai_insights').upsert({
                    poll_id: id,
                    insights: { status: 'failed', error: err.message },
                    updated_at: new Date().toISOString()
                }, { onConflict: 'poll_id' });
            }
        })());

        return NextResponse.json(processingData);

    } catch (error: any) {
        console.error('AI Insights Route Error:', error);
        return NextResponse.json(
            { error: 'Failed to process AI insights', details: error.message },
            { status: 500 }
        );
    }
}
