export interface CreatePollRequest {
  creatorName: string;
  email: string;
  friends: { name: string; gender: string }[];
  questions: string[];
}




export interface Poll {
  id: string;
  questions: string[];
  friends: { id: string; name: string }[];
  expires_at: string;
  status: string;
  creatorName?: string;
}



export async function createPoll(
  request: CreatePollRequest
): Promise<{ id: string; adminToken: string }> {

  const response = await fetch('/api/polls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || errorData.error || 'Failed to create poll');
  }


  return response.json();
}

export async function getPoll(pollId: string): Promise<Poll> {
  const response = await fetch(`/api/polls/${pollId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch poll');
  }

  return response.json();
}

export async function submitVote(
  pollId: string,
  friendId: string,
  question: string,
  voterId: string
): Promise<void> {
  const response = await fetch(`/api/polls/${pollId}/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ friendId, question, voterId }),
  });


  if (!response.ok) {
    throw new Error('Failed to submit vote');
  }
}

export async function getResults(
  pollId: string
): Promise<{ results: Record<string, Record<string, number>>; totalVoters: number }> {

  const response = await fetch(`/api/polls/${pollId}/results`);

  if (!response.ok) {
    throw new Error('Failed to fetch results');
  }

  return response.json();
}

export interface AIInsights {
  status?: 'processing' | 'completed' | 'failed';
  error?: string;
  friendJudgments: { name: string; judgment: string }[];
  songDedications: {
    name: string;
    song: string;
    artist: string;
    vibe: string;
    reason: string;
  }[];
  groupVerdict: { summary: string };
  pairCommentaries: { pair: string; commentary: string }[];
  message?: string;
  isClosed?: boolean;
}

export async function getAIInsights(pollId: string, force?: boolean): Promise<AIInsights> {
  const url = `/api/polls/${pollId}/ai-insights${force ? '?force=true' : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || errorData.error || 'Failed to fetch AI insights');
  }
  return response.json();
}
