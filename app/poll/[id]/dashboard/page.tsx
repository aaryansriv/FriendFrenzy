'use client';

import { useEffect, useState } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { Frenzy, getFrenzy, getResults } from '@/lib/api';
import { Loader2, Users, BarChart2, Share2, Crown, Lock, Unlock, Calendar, Trash2, ArrowLeft, Sparkles, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ResultsDisplay } from '@/components/results-display';
import { PAIR_FRENZY_QUESTIONS } from '@/lib/questions';

export default function DashboardPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const frenzyId = params.id as string;

    const token = searchParams.get('token');

    const [frenzy, setFrenzy] = useState<Frenzy | null>(null);
    const [results, setResults] = useState<Record<string, Record<string, number>>>({});
    const [totalVoters, setTotalVoters] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const loadData = async () => {
        try {
            const frenzyData = await getFrenzy(frenzyId);
            // In a real app, we'd verify the token on the server
            // For now, we'll just check if the token exists to "protect" the view
            if (!token) {
                setError('Unauthorized access. Token required.');
                setLoading(false);
                return;
            }

            setFrenzy(frenzyData);
            const resultsData = await getResults(frenzyId);
            setResults(resultsData.results);
            setTotalVoters(resultsData.totalVoters);
        } catch (err) {
            setError('Frenzy not found');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
        const interval = setInterval(loadData, 5000);
        return () => clearInterval(interval);
    }, [frenzyId, token]);

    const handleAction = async (action: string) => {
        if (!token) return;
        setIsProcessing(true);
        try {
            const response = await fetch(`/api/polls/${frenzyId}/admin`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ adminToken: token, action }),
            });

            if (!response.ok) throw new Error('Action failed');

            await loadData();
            alert(`Frenzy ${action}d successfully!`);
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
            const response = await fetch(`/api/polls/${frenzyId}/admin?token=${token}`, {
                method: 'DELETE',
            });

            if (!response.ok) throw new Error('Delete failed');

            alert('Frenzy deleted successfully!');
            window.location.href = '/';
        } catch (err) {
            alert('Failed to delete frenzy');
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

    if (error || !frenzy) {
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
                            <h1 className="text-4xl font-black">{frenzy.frenzyName}</h1>
                            <span className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase rounded-full">Admin</span>
                        </div>
                        <p className="text-black/60 font-black uppercase text-xs tracking-widest">Managing: {frenzyId}</p>
                    </div>

                    <div className="flex gap-4">
                        <Button
                            onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/poll/${frenzyId}`);
                                alert('Frenzy link copied!');
                            }}
                            className="bg-black/5 hover:bg-black/10 border-2 border-black/20 rounded-full px-6 text-black font-bold h-14"
                        >
                            <Share2 className="w-5 h-5 mr-2" /> Share Frenzy
                        </Button>
                    </div>
                </header>

                {/* Stats Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    <div className="bg-black text-white p-8 rounded-3xl space-y-2">
                        <Users className="w-8 h-8 opacity-50" />
                        <p className="text-sm font-bold opacity-60">Total Users Voted</p>
                        <p className="text-5xl font-black">{totalVoters}</p>
                    </div>
                    <div className="bg-white border-4 border-black p-8 rounded-3xl space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-1">
                                <p className="text-sm font-bold text-black/60">Frenzy Status</p>
                                <p className="text-3xl font-black uppercase text-black">{frenzy.status}</p>
                            </div>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${frenzy.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                                {frenzy.status === 'active' ? <BarChart2 className="w-6 h-6" /> : <Lock className="w-6 h-6" />}
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            {frenzy.status === 'active' ? (
                                <Button
                                    disabled={isProcessing}
                                    onClick={() => handleAction('close')}
                                    className="w-full bg-black text-white hover:bg-black/90 h-14 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Lock className="w-5 h-5" /> Close Poll
                                </Button>
                            ) : (
                                <Button
                                    onClick={() => {
                                        const el = document.getElementById('ai-preview');
                                        el?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="w-full bg-indigo-600 text-white hover:bg-indigo-700 h-14 rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2"
                                >
                                    <Sparkles className="w-5 h-5" /> Generate Verdict
                                </Button>
                            )}

                            <div className="flex gap-2">
                                {frenzy.status === 'closed' && (
                                    <Button
                                        variant="outline"
                                        disabled={isProcessing}
                                        onClick={() => handleAction('open')}
                                        className="flex-1 border-2 border-black rounded-xl font-bold h-10 text-xs"
                                    >
                                        <Unlock className="w-3 h-3 mr-2" /> Re-open Poll
                                    </Button>
                                )}
                                <Button
                                    variant="destructive"
                                    disabled={isProcessing}
                                    onClick={handleDelete}
                                    className="flex-1 rounded-xl font-bold h-10 text-xs"
                                >
                                    <Trash2 className="w-3 h-3 mr-2" /> Delete Poll
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* AI Analytics Card */}
                    <div className={`bg-indigo-600 text-white p-8 rounded-3xl space-y-4 shadow-xl transition-all ${frenzy.status === 'closed' ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none'}`}>
                        <div className="flex items-center justify-between">
                            <Sparkles className="w-8 h-8 text-indigo-300" />
                            <span className="text-[10px] font-black bg-white/20 px-3 py-1 rounded-full uppercase">Frenzy AI Active</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-xs font-black uppercase tracking-widest text-indigo-200">The Social Oracle</p>
                            <h3 className="text-2xl font-black italic">Frenzy AI Verdict</h3>
                        </div>
                        <p className="text-sm font-medium text-indigo-100">
                            {frenzy.status === 'closed'
                                ? 'Your squad roasts and playlist are ready to drop!'
                                : 'Unlock the verdict by closing the frenzy.'}
                        </p>
                        {frenzy.status === 'closed' && (
                            <div className="flex flex-col gap-2 pt-2">
                                <Button
                                    onClick={() => {
                                        const el = document.getElementById('ai-preview');
                                        el?.scrollIntoView({ behavior: 'smooth' });
                                    }}
                                    className="bg-white text-indigo-600 hover:bg-indigo-50 font-black rounded-xl h-10 w-full text-xs"
                                >
                                    View Report Preview
                                </Button>
                                <Button
                                    onClick={() => {
                                        const text = encodeURIComponent(`OMG! The Frenzy AI just COOKED our squad! 💀 Check the leaks and the playlist: ${window.location.origin}/poll/${frenzyId}`);
                                        window.open(`https://wa.me/?text=${text}`, '_blank');
                                    }}
                                    className="bg-indigo-500 hover:bg-indigo-400 text-white font-black rounded-xl h-10 w-full text-xs flex items-center justify-center gap-2"
                                >
                                    <Share2 className="w-3 h-3" /> Share Roast with Squad
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Questions Detail */}
                <div className="space-y-8">
                    <h2 className="text-3xl font-black">Admin Questions View</h2>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {frenzy.questions.map((question: string, idx: number) => {
                            const qResults = results[question] || {};
                            const totalQVotes = Object.values(qResults).reduce((a, b) => a + b, 0);

                            const sortedResults = Object.entries(qResults)
                                .sort(([, a], [, b]) => b - a);

                            return (
                                <div key={idx} className="border-4 border-black p-8 rounded-3xl space-y-6">
                                    <div className="space-y-2">
                                        <h3 className="text-xl font-black leading-tight">{question}</h3>
                                        <p className="text-sm font-bold text-black/60">{totalQVotes} {totalQVotes === 1 ? 'vote' : 'votes'} total</p>
                                    </div>

                                    <div className="space-y-4">
                                        {(() => {
                                            // 1. Detect if it's a Pair Frenzy question
                                            const pairTemplate = PAIR_FRENZY_QUESTIONS.find(t => {
                                                const regex = new RegExp(t.template.replace('{A}', '.*').replace('{B}', '.*'));
                                                return regex.test(question);
                                            });

                                            if (pairTemplate) {
                                                // Display percentage options
                                                return pairTemplate.options.map((opt) => {
                                                    const votes = qResults[`option:${opt}`] || 0;
                                                    const percentage = totalQVotes > 0 ? (votes / totalQVotes) * 100 : 0;
                                                    const isWinning = votes > 0 && votes === Math.max(...Object.values(qResults));

                                                    return (
                                                        <div key={opt} className="space-y-2">
                                                            <div className="flex justify-between items-center text-sm font-bold">
                                                                <span className="flex items-center gap-2">
                                                                    {opt}% {isWinning && <Crown className="w-4 h-4 text-yellow-500 fill-current" />}
                                                                </span>
                                                                <span>{votes} ({Math.round(percentage)}%)</span>
                                                            </div>
                                                            <div className="h-3 bg-black/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full transition-all duration-500 ${isWinning ? 'bg-indigo-600' : 'bg-indigo-600/30'}`}
                                                                    style={{ width: `${percentage}%` }}
                                                                />
                                                            </div>
                                                        </div>
                                                    );
                                                });
                                            }

                                            // 2. Fallback to friend-based results
                                            return frenzy.friends.map((friend: any) => {
                                                const votes = qResults[friend.id] || qResults[friend.name] || 0;
                                                const percentage = totalQVotes > 0 ? (votes / totalQVotes) * 100 : 0;
                                                const isWinning = votes > 0 && votes === Math.max(...Object.values(qResults));

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
                                            });
                                        })()}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* AI / Public Preview Section */}
                {frenzy.status === 'closed' && (
                    <div id="ai-preview" className="space-y-8 pt-12 border-t border-black/10">
                        <div className="flex items-center justify-between">
                            <h2 className="text-3xl font-black italic flex items-center gap-3">
                                <Eye className="w-8 h-8 text-indigo-600" /> FULL PUBLIC REPORT
                            </h2>
                            <p className="text-black/40 font-bold text-sm uppercase tracking-widest">Previewing what users see</p>
                        </div>
                        <div className="border-8 border-indigo-600 rounded-[3.5rem] overflow-hidden shadow-2xl scale-[0.98] hover:scale-100 transition-transform duration-500">
                            <ResultsDisplay
                                frenzyId={frenzyId}
                                questions={frenzy.questions}
                                allResults={results}
                                isClosed={true}
                                isAdmin={true}
                                friends={frenzy.friends}
                            />
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
