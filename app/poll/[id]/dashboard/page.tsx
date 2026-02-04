'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Poll, getPoll, getResults } from '@/lib/api';
import { Loader2, Users, BarChart2, Share2, Crown, Lock, Unlock, Calendar, Trash2, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const pollId = params.id as string;

    const token = searchParams.get('token');

    const [poll, setPoll] = useState<Poll | null>(null);
    const [results, setResults] = useState<Record<string, Record<string, number>>>({});
    const [totalVoters, setTotalVoters] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const loadData = async () => {
        try {
            const pollData = await getPoll(pollId);
            // In a real app, we'd verify the token on the server
            // For now, we'll just check if the token exists to "protect" the view
            if (!token) {
                setError('Unauthorized access. Token required.');
                setLoading(false);
                return;
            }

            setPoll(pollData);
            const resultsData = await getResults(pollId);
            setResults(resultsData.results);
            setTotalVoters(resultsData.totalVoters);
        } catch (err) {
            setError('Poll not found');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, [pollId, token]);

    const handleAction = async (action: string) => {
        if (!token) return;
        setIsProcessing(true);
        try {
            const response = await fetch(`/api/polls/${pollId}/admin`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminToken: token, action }),
            });

            if (!response.ok) throw new Error('Action failed');

            await loadData();
            alert(`Poll ${action}d successfully!`);
        } catch (err) {
            alert('Failed to perform action');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleDelete = async () => {
        if (!token || !confirm('Are you sure? This will delete all votes and results forever!')) return;

        setIsProcessing(true);
        try {
            const response = await fetch(`/api/polls/${pollId}/admin?token=${token}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Delete failed');

            alert('Poll deleted successfully!');
            window.location.href = '/';
        } catch (err) {
            alert('Failed to delete poll');
            setIsProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-black" />
            </div>
        );
    }

    if (error || !poll) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center p-8 text-center">
                <h1 className="text-3xl font-bold text-red-500 mb-4">{error}</h1>
                <Button onClick={() => window.location.href = '/'} className="bg-black text-white rounded-full px-8 py-3">
                    Back Home
                </Button>
            </div>
        );
    }


    return (
        <main className="min-h-screen bg-white p-8 md:p-12 relative">
            <div className="max-w-6xl mx-auto space-y-12">


                {/* Header */}
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-black/10 pb-12">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <h1 className="text-4xl font-black">{poll.creatorName}'s Dashboard</h1>
                            <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase rounded-full">Admin</span>
                        </div>
                        <p className="text-black/60 font-black uppercase text-xs tracking-widest">Managing: {pollId}</p>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/poll/${pollId}`);
                                alert('Poll link copied!');
                            }}
                            className="bg-black/5 hover:bg-black/10 border-2 border-black/20 rounded-full px-6 text-black font-bold h-14"
                        >
                            <Share2 className="w-5 h-5 mr-2" /> Share Poll
                        </Button>
                    </div>
                </header>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="bg-black text-white p-8 rounded-3xl space-y-2">
                        <Users className="w-8 h-8 opacity-50" />
                        <p className="text-sm font-bold opacity-60">Total Users Voted</p>
                        <p className="text-5xl font-black">{totalVoters}</p>
                    </div>
                    <div className="bg-white border-4 border-black p-8 rounded-3xl space-y-2">
                        <BarChart2 className="w-8 h-8 text-black opacity-50" />
                        <p className="text-sm font-bold text-black/60">Poll Status</p>
                        <p className="text-3xl font-black uppercase">{poll.status}</p>
                    </div>
                    <div className="bg-white border-4 border-black p-8 rounded-3xl space-y-4">
                        <Calendar className="w-8 h-8 text-black opacity-50" />
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-bold text-black/60">Poll Actions</p>
                            <span className="text-[10px] font-black bg-black/5 px-2 py-0.5 rounded-full uppercase text-black/40">Expires +7 Days</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                disabled={isProcessing}
                                onClick={() => handleAction(poll.status === 'active' ? 'close' : 'open')}
                                className={`border-2 border-black rounded-full font-bold transition-all ${poll.status === 'active' ? 'bg-black text-white hover:bg-black/80' : 'bg-white text-black hover:bg-black/5'}`}
                            >
                                {poll.status === 'active' ? <Lock className="w-4 h-4 mr-2" /> : <Unlock className="w-4 h-4 mr-2" />}
                                {poll.status === 'active' ? 'Status: Active (Close)' : 'Status: Closed (Open)'}
                            </Button>

                            <Button
                                variant="destructive"
                                size="sm"
                                disabled={isProcessing}
                                onClick={handleDelete}
                                className="rounded-full font-bold"
                            >
                                <Trash2 className="w-4 h-4 mr-2" /> Delete
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Questions Detail */}
                <div className="space-y-8">
                    <h2 className="text-3xl font-black">Live Results</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {poll.questions.map((question, idx) => {
                            const qResults = results[question] || {};
                            const totalQVotes = Object.values(qResults).reduce((a, b) => a + b, 0);

                            const sortedResults = Object.entries(qResults)
                                .sort(([, a], [, b]) => b - a);

                            return (
                                <div key={idx} className="border-4 border-black p-8 rounded-3xl space-y-6">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black leading-tight">{question}</h3>
                                        <p className="text-sm font-bold text-black/60">{totalQVotes} votes total</p>
                                    </div>

                                    <div className="space-y-4">
                                        {poll.friends.map(friend => {
                                            const votes = qResults[friend.name] || 0;
                                            const percentage = totalQVotes > 0 ? (votes / totalQVotes) * 100 : 0;
                                            const isWinning = votes > 0 && votes === sortedResults[0]?.[1];

                                            return (
                                                <div key={friend.id} className="space-y-2">
                                                    <div className="flex justify-between items-center text-sm font-bold">
                                                        <span className="flex items-center gap-2">
                                                            {friend.name} {isWinning && <Crown className="w-4 h-4 text-yellow-500 fill-current" />}
                                                        </span>
                                                        <span>{votes} ({Math.round(percentage)}%)</span>
                                                    </div>
                                                    <div className="h-3 bg-black/10 rounded-full overflow-hidden">
                                                        <div
                                                            className={`h-full transition-all duration-500 ${isWinning ? 'bg-black' : 'bg-black/30'}`}
                                                            style={{ width: `${percentage}%` }}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </main>
    );
}
