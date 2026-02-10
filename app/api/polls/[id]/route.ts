import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    // Get poll
    const { data: poll, error: pollError } = await supabase
      .from('polls')
      .select('*, creators(name)')
      .eq('id', id)
      .single();


    if (pollError || !poll) {
      return NextResponse.json(
        { error: 'Frenzy not found' },
        { status: 404 }
      );
    }

    // Get friends
    const { data: friends, error: friendsError } = await supabase
      .from('friends')
      .select('id, name')
      .eq('poll_id', id);

    if (friendsError) throw friendsError;

    // Get all questions - combine question_set array
    const questions = Array.isArray(poll.question_set) ? poll.question_set : [];

    return NextResponse.json({
      id: poll.id,
      questions,
      friends: friends || [],
      expires_at: poll.expires_at,
      status: poll.status,
      frenzyName: poll.poll_name,
    });

  } catch (error) {
    console.error('Failed to fetch poll:', error);
    return NextResponse.json(
      { error: 'Failed to fetch poll' },
      { status: 500 }
    );
  }
}
