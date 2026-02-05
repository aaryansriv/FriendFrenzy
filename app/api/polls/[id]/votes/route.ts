import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip.trim();
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = getSupabase();

    const body = await request.json();
    const { friendId, question, voterId } = body;
    const clientIp = getClientIp(request);

    if (!friendId || !question || !voterId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const isOptionVote = friendId.startsWith('option:');
    const optionValue = isOptionVote ? friendId.replace('option:', '') : null;
    const actualFriendId = isOptionVote ? null : friendId;

    // Check if poll exists and is active
    const { data: poll, error: pollFetchError } = await supabase
      .from('polls')
      .select('status, expires_at')
      .eq('id', id)
      .single();

    if (pollFetchError || !poll) {
      return NextResponse.json({ error: 'Poll not found' }, { status: 404 });
    }

    const now = new Date();
    const expiresAt = new Date(poll.expires_at);

    if (poll.status !== 'active' || now > expiresAt) {
      return NextResponse.json(
        { error: 'This poll is no longer accepting votes.' },
        { status: 403 }
      );
    }


    // Verify voter identity belongs to this poll
    const { data: voter, error: voterError } = await supabase
      .from('friends')
      .select('id')
      .eq('id', voterId)
      .eq('poll_id', id)
      .maybeSingle();

    if (voterError || !voter) {
      return NextResponse.json(
        { error: 'Invalid voter identity for this poll.' },
        { status: 401 }
      );
    }

    // Check if user already voted for this question
    const { data: existingVote } = await supabase
      .from('votes')
      .select('id')
      .eq('poll_id', id)
      .eq('question', question)
      .eq('voter_id', voterId)
      .maybeSingle();

    if (existingVote) {
      return NextResponse.json(
        { error: `You already voted on "${question}"` },
        { status: 409 }
      );
    }


    // 1. Record the vote itself
    const { error: voteError } = await supabase
      .from('votes')
      .insert({
        poll_id: id,
        target_friend_id: actualFriendId,
        answer_option: optionValue,
        voter_id: voterId,
        question,
        voter_ip: clientIp,
      });

    if (voteError) throw voteError;

    // 2. Atomically increment the results table using our new DB function
    const { error: rpcError } = await supabase.rpc('increment_poll_result', {
      p_poll_id: id,
      p_question: question,
      p_friend_id: actualFriendId,
      p_answer_option: optionValue
    });

    if (rpcError) {
      console.error('RPC Result Error:', rpcError);
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (error) {
    console.error('Failed to submit vote:', error);
    return NextResponse.json(
      { error: 'Failed to submit vote' },
      { status: 500 }
    );
  }
}
