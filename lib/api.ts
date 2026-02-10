export interface CreateFrenzyRequest {
  frenzyName: string;
  email: string;
  friends: { name: string; gender: string }[];
  questions: string[];
}

export interface Frenzy {
  id: string;
  questions: string[];
  friends: { id: string; name: string }[];
  expires_at: string;
  status: string;
  frenzyName?: string;
}



export async function createFrenzy(
  request: CreateFrenzyRequest
): Promise<{ id: string; adminToken: string }> {

  const response = await fetch('/api/polls', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || errorData.error || 'Failed to create frenzy');
  }


  return response.json();
}

export async function getFrenzy(frenzyId: string): Promise<Frenzy> {
  const response = await fetch(`/api/polls/${frenzyId}`);

  if (!response.ok) {
    throw new Error('Failed to fetch frenzy');
  }

  return response.json();
}

export async function submitVote(
  frenzyId: string,
  friendId: string,
  question: string,
  voterId: string
): Promise<void> {
  const response = await fetch(`/api/polls/${frenzyId}/votes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ friendId, question, voterId }),
  });


  if (!response.ok) {
    throw new Error('Failed to submit vote');
  }
}

export async function getResults(
  frenzyId: string
): Promise<{ results: Record<string, Record<string, number>>; totalVoters: number }> {

  const response = await fetch(`/api/polls/${frenzyId}/results`);

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

export async function getAIInsights(frenzyId: string, force?: boolean): Promise<AIInsights> {
  const url = `/api/polls/${frenzyId}/ai-insights${force ? '?force=true' : ''}`;
  const response = await fetch(url);
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.details || errorData.error || 'Failed to fetch AI insights');
  }
  return response.json();
}
