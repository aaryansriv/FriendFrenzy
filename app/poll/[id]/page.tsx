'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Poll, getPoll, submitVote, getResults } from '@/lib/api';
import { VotingInterface } from '@/components/voting-interface';
import { ResultsDisplay } from '@/components/results-display';
import { Confetti } from '@/components/confetti';
import { Loader2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';



export default function PollPage() {
  const params = useParams();
  const router = useRouter();
  const pollId = params.id as string;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [votedQuestions, setVotedQuestions] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [allResults, setAllResults] = useState<Record<string, Record<string, number>>>({});
  const [voterId, setVoterId] = useState<string | null>(null);
  const [totalVoters, setTotalVoters] = useState(0);
  const [showConfetti, setShowConfetti] = useState(false);
  const [voteError, setVoteError] = useState<string | null>(null);


  useEffect(() => {
    const loadPoll = async () => {
      try {
        const pollData = await getPoll(pollId);
        setPoll(pollData);
      } catch (err) {
        setError('Poll not found or has expired');
      } finally {
        setLoading(false);
      }
    };

    loadPoll();
  }, [pollId]);

  // Real-time polling for results updates
  useEffect(() => {
    if (votedQuestions.size === 0 || !poll) return;

    const interval = setInterval(async () => {
      try {
        const resultsData = await getResults(pollId);
        setAllResults(resultsData.results);
        setTotalVoters(resultsData.totalVoters);
      } catch (err) {
        console.error('Failed to fetch results:', err);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [votedQuestions, poll, pollId]);


  const handleVote = async (friendId: string) => {
    if (!poll || !voterId) return;

    const currentQuestion = poll.questions[currentQuestionIndex];

    try {
      setVoteError(null);
      await submitVote(pollId, friendId, currentQuestion, voterId);
      setShowConfetti(true);
      setVotedQuestions((prev) => new Set([...prev, currentQuestion]));

      // Load all results
      const resultsData = await getResults(pollId);
      setAllResults(resultsData.results);
      setTotalVoters(resultsData.totalVoters);

      // Move to next question or show results
      setTimeout(() => {
        setCurrentQuestionIndex((prev) => prev + 1);
        setShowConfetti(false);
      }, 1500);

    } catch (err: any) {
      console.error('Vote error:', err);
      setVoteError(err.message || 'Failed to submit vote. You may have already voted.');
    }
  };


  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBulkSubmit = async (votes: Record<string, string>, confession?: string) => {
    if (!poll || !voterId) return;
    setIsSubmitting(true);
    try {
      setVoteError(null);
      // Submit each vote
      for (const [question, friendId] of Object.entries(votes)) {
        await submitVote(pollId, friendId, question, voterId);
      }

      // Submit confession if exists
      if (confession && confession.trim()) {
        await fetch(`/api/polls/${pollId}/confessions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ confession }),
        });
      }

      setShowConfetti(true);
      setVotedQuestions(new Set(poll.questions));

      const resultsData = await getResults(pollId);
      setAllResults(resultsData.results);
      setTotalVoters(resultsData.totalVoters);

      setTimeout(() => {
        setCurrentQuestionIndex(poll.questions.length); // Trigger results view
        setShowConfetti(false);
      }, 2000);
    } catch (err: any) {
      setVoteError(err.message || 'Failed to submit votes');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-black animate-spin mx-auto" />
          <p className="text-black/60 font-medium">Loading poll...</p>
        </div>
      </main>
    );
  }

  if (error || !poll) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="text-center space-y-4">
          <h1 className="text-3xl font-bold">Poll Not Found</h1>
          <p className="text-black/60">The poll you're looking for doesn't exist or has expired.</p>
          <a href="/" className="inline-block mt-4 px-8 py-3 bg-black text-white rounded-full hover:bg-black/80 font-bold">
            Create a New Poll
          </a>
        </div>
      </main>
    );
  }

  // If closed, show results immediately
  if (poll.status === 'closed') {
    return (
      <main className="min-h-screen bg-white relative">
        <ResultsDisplay
          pollId={pollId}
          questions={poll.questions}
          allResults={allResults}
          isClosed={true}
        />
      </main>
    );
  }

  // Identity Selection Step
  if (!voterId && !votedQuestions.size) {
    return (
      <main className="min-h-screen bg-white flex items-center justify-center p-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <h1 className="text-4xl font-black">WHO ARE YOU?</h1>
          <p className="text-black/60 font-bold">Only people in the friends list can vote.</p>
          <div className="grid gap-3">
            {poll.friends.map(friend => (
              <button
                key={friend.id}
                onClick={() => setVoterId(friend.id)}
                className="w-full p-6 border-4 border-black rounded-2xl font-black text-2xl hover:bg-black hover:text-white transition-all active:scale-95"
              >
                {friend.name}
              </button>
            ))}
          </div>
        </div>
      </main>
    );
  }

  const allQuestionsAnswered = poll && currentQuestionIndex >= poll.questions.length;

  return (
    <main className="min-h-screen bg-white relative">
      {showConfetti && <Confetti />}



      {voteError && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-red-500 text-white px-6 py-3 rounded-full font-bold shadow-lg animate-bounce text-center">
          {voteError}
        </div>
      )}

      {allQuestionsAnswered ? (
        <ResultsDisplay
          pollId={pollId}
          questions={poll.questions}
          allResults={allResults}
          isClosed={poll.status === 'closed'}
        />
      ) : (
        <VotingInterface
          poll={poll}
          onVotesSubmit={handleBulkSubmit}
          isSubmitting={isSubmitting}
        />
      )}
    </main>
  );
}

