export interface CreatePollRequest {
  creatorName: string;
  email: string;
  friends: string[];
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
