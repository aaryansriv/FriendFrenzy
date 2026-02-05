import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    // 1. Get all results for this poll
    const { data: results, error: resultsError } = await supabase
      .from('results')
      .select('question, friend_id, answer_option, friends(name), vote_count')
      .eq('poll_id', id);

    if (resultsError) throw resultsError;

    // 2. Organize by question
    const organized: Record<string, Record<string, number>> = {};
    if (results) {
      for (const result of results) {
        if (!organized[result.question]) {
          organized[result.question] = {};
        }
        const label = result.answer_option ? `${result.answer_option}%` : (result.friends?.name || 'Unknown');
        organized[result.question][label] = result.vote_count || 0;
      }
    }

    // 3. Get unique voter count
    const { data: votes } = await supabase
      .from('votes')
      .select('voter_ip')
      .eq('poll_id', id);

    const totalVoters = votes ? new Set(votes.map((v: any) => v.voter_ip)).size : 0;

    return NextResponse.json({
      results: organized,
      totalVoters
    });


  } catch (error) {
    console.error('Failed to fetch results:', error);
    return NextResponse.json(
      { error: 'Failed to fetch results' },
      { status: 500 }
    );
  }
}
