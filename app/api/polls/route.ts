import { NextRequest, NextResponse } from 'next/server';
import { getSupabase } from '@/lib/supabase';
import { PAIR_FRENZY_QUESTIONS } from '@/lib/questions';


function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : request.headers.get('x-real-ip') || 'unknown';
  return ip.trim();
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { creatorName, friends, questions, email } = body;

    if (!creatorName || typeof creatorName !== 'string' || creatorName.trim().length === 0) {
      return NextResponse.json(
        { error: 'Creator name is required' },
        { status: 400 }
      );
    }

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return NextResponse.json(
        { error: 'Valid email is required' },
        { status: 400 }
      );
    }

    if (!friends || !Array.isArray(friends) || friends.length < 2) {
      return NextResponse.json(
        { error: 'At least 2 friends are required' },
        { status: 400 }
      );
    }

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return NextResponse.json(
        { error: 'At least 1 question is required' },
        { status: 400 }
      );
    }

    const clientIp = getClientIp(request);
    const supabase = getSupabase();

    // 0. Basic Anti-Spam Check (Rate Limit)
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: recentPolls } = await supabase
      .from('polls')
      .select('*', { count: 'exact', head: true })
      .eq('creator_ip', clientIp)
      .gt('created_at', fiveMinutesAgo);

    if ((recentPolls || 0) >= 30) {
      return NextResponse.json(
        { error: 'Too many polls created. Please wait a few minutes.' },
        { status: 429 }
      );
    }


    // 1. Handle Creator (Upsert style approach)
    let creatorId: string;

    // Check if creator exists by EMAIL
    const { data: existingCreator, error: fetchError } = await supabase
      .from('creators')
      .select('id')
      .eq('email', email.trim())
      .maybeSingle();

    if (existingCreator) {
      creatorId = existingCreator.id;
    } else {
      // Create new creator
      const { data: newCreator, error: createError } = await supabase
        .from('creators')
        .insert({ name: creatorName.trim(), email: email.trim() })
        .select('id')
        .single();

      if (createError) throw createError;
      creatorId = newCreator.id;
    }

    // 1.5 Calculate sequential poll ID for this creator
    const { count: userPollCount } = await supabase
      .from('polls')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creatorId);

    const creatorPollId = (userPollCount || 0) + 1;


    const adminToken = crypto.randomUUID();
    const { data: pollData, error: pollError } = await supabase
      .from('polls')
      .insert({
        creator_id: creatorId,
        creator_ip: clientIp,
        question_set: questions,
        status: 'active',
        admin_token: adminToken,
        creator_poll_id: creatorPollId
      })
      .select()
      .single();


    if (pollError) throw pollError;

    // Add friends
    const friendsData = friends.map((f: any) => ({
      poll_id: pollData.id,
      name: f.name.trim(),
      gender: f.gender
    }));

    const { data: friendsList, error: friendsError } = await supabase
      .from('friends')
      .insert(friendsData)
      .select();

    if (friendsError) throw friendsError;

    // Initialize results for all questions and friends
    const resultsData: any[] = [];

    for (const question of questions) {
      // Check if this looks like a Pair Frenzy question
      // This is a simple check: if it has digits or seems to be from a template
      const isPairFrenzy = PAIR_FRENZY_QUESTIONS.some(tmpl => {
        const regex = new RegExp(tmpl.template.replace('{A}', '.*').replace('{B}', '.*'));
        return regex.test(question);
      });

      if (isPairFrenzy) {
        // Get the specific template to find options
        const tmpl = PAIR_FRENZY_QUESTIONS.find(t => {
          const regex = new RegExp(t.template.replace('{A}', '.*').replace('{B}', '.*'));
          return regex.test(question);
        });

        const options = tmpl?.options || [0, 25, 50, 75, 100];
        for (const opt of options) {
          resultsData.push({
            poll_id: pollData.id,
            question,
            answer_option: opt.toString(),
            vote_count: 0,
          });
        }
      } else {
        // Standard "Who is..." question
        for (const friend of friendsList) {
          resultsData.push({
            poll_id: pollData.id,
            question,
            friend_id: friend.id,
            vote_count: 0,
          });
        }
      }
    }

    const { error: resultsError } = await supabase
      .from('results')
      .insert(resultsData);

    if (resultsError) throw resultsError;

    return NextResponse.json({ id: pollData.id, adminToken, creatorPollId }, { status: 201 });

  } catch (error: any) {
    console.error('Failed to create poll. Full error:', error);

    // Log additional details if it's a Supabase error
    if (error.code) {
      console.error('Supabase Error Code:', error.code);
      console.error('Supabase Error Message:', error.message);
      console.error('Supabase Error Details:', error.details);
    }

    return NextResponse.json(
      {
        error: 'Failed to create poll',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
        code: error.code
      },
      { status: 500 }
    );
  }
}

