'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Crown, Sparkles, Music, Quote, Users, Play, ExternalLink, RefreshCw, Share2 } from 'lucide-react';
import { getAIInsights, AIInsights } from '@/lib/api';

interface ResultsDisplayProps {
  pollId: string;
  questions: string[];
  allResults: Record<string, Record<string, number>>;
  isClosed: boolean;
  isAdmin?: boolean;
}

const STALL_MESSAGES = [
  "Scraping the group chat for drama...",
  "Analyzing your questionable life choices...",
  "Consulting the chaos gods...",
  "Roast in progress. Prepare for emotional damage...",
  "Checking which friend is most likely to block you...",
  "Spilling the tea. It's hot.",
  "Calculating the exact level of NPC energy...",
  "Gathering the evidence. You're cooked.",
  "Reading your anonymous confessions... yikes.",
  "Assigning main character energy. Or lack thereof.",
  "Finalizing the sonic vibes...",
  "Wait, people actually voted for this?",
  "The AI is laughing. That's usually a bad sign.",
  "Is that a red flag or a whole parade?",
  "Brewing the perfect blend of sarcasm...",
];

export function ResultsDisplay({ pollId, questions, allResults, isClosed, isAdmin }: ResultsDisplayProps) {
  const [aiInsights, setAiInsights] = useState<AIInsights | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [stallMessage, setStallMessage] = useState(STALL_MESSAGES[0]);
  const [isStallExiting, setIsStallExiting] = useState(false);

  // Stall message rotation
  useEffect(() => {
    if (!loadingAI) return;
    const interval = setInterval(() => {
      setIsStallExiting(true);
      setTimeout(() => {
        setStallMessage(prev => {
          const currentIndex = STALL_MESSAGES.indexOf(prev);
          return STALL_MESSAGES[(currentIndex + 1) % STALL_MESSAGES.length];
        });
        setIsStallExiting(false);
      }, 500); // Wait for fade out
    }, 4000); // 4 seconds per message
    return () => clearInterval(interval);
  }, [loadingAI]);

  useEffect(() => {
    let pollInterval: NodeJS.Timeout;
    let pollCount = 0;
    const MAX_POLLS = 30; // Increased to 90 seconds to be safe

    const fetchInsights = async (isForced = false) => {
      if (!isClosed) return;
      setLoadingAI(true);

      try {
        console.log(`AI_UI: Requesting ${isForced ? 'forced ' : ''}insights for ${pollId}`);
        const data = await getAIInsights(pollId, isForced);

        const status = (data as any).status;
        const isFallback = data.friendJudgments?.some((j: any) => j.judgment.includes('FALLBACK_GENERATION'));

        console.log(`AI_UI: Received status: ${status}, isFallback: ${isFallback}`);

        if (status === 'completed' && !isFallback) {
          console.log("AI_UI: Insights successfully loaded!");
          setAiInsights(data);
          setLoadingAI(false);
          if (pollInterval) clearInterval(pollInterval);
        } else if (status === 'processing' || isForced || isFallback) {
          // If the server is still processing, or we got a fallback, we must keep polling
          if (!pollInterval) {
            console.log("AI_UI: Starting poll loop...");
            pollInterval = setInterval(async () => {
              pollCount++;
              console.log(`AI_UI: Polling attempt ${pollCount}/${MAX_POLLS}`);

              if (pollCount >= MAX_POLLS) {
                console.log("AI_UI: Max polls reached. Stopping loader.");
                clearInterval(pollInterval);
                setLoadingAI(false);
                return;
              }

              try {
                // Poll WITHOUT forcing, so it just reads from Supabase
                const pollData = await getAIInsights(pollId, false);
                const pollStatus = (pollData as any).status;

                if (pollStatus === 'completed') {
                  console.log("AI_UI: Real insights found leading to UI update!");
                  setAiInsights(pollData);
                  setLoadingAI(false);
                  clearInterval(pollInterval);
                } else if (pollStatus === 'failed') {
                  console.log("AI_UI: AI specifically marked as failed in DB.");
                  setAiInsights(pollData);
                  setLoadingAI(false);
                  clearInterval(pollInterval);
                }
              } catch (err) {
                console.error("AI_UI: Poller error:", err);
              }
            }, 3000); // Check every 3 seconds
          }
        } else {
          // If already completed but fallback, or unknown, stop loading
          console.log("AI_UI: Reached end of logic, stopping loader.");
          if (data.friendJudgments) setAiInsights(data);
          setLoadingAI(false);
        }
      } catch (err: any) {
        console.error('Failed to fetch AI insights:', err);
        setLoadingAI(false);
      }
    };

    fetchInsights(refreshKey > 0);

    return () => {
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [pollId, isClosed, refreshKey]);

  if (!questions) return null;

  const handleShareRoast = (name: string, judgment: string) => {
    const text = encodeURIComponent(`💀 FRENZY AI JUST ROASTED ${name.toUpperCase()}!\n\n"${judgment}"\n\nSee all roasts here: ${window.location.origin}/poll/${pollId}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-4 md:p-12">
      <div className="max-w-7xl mx-auto space-y-16">
        {/* Header */}
        <div className="text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-6 py-2 bg-black text-white rounded-full text-xs font-black tracking-[0.2em] uppercase shadow-xl animate-bounce">
            {isClosed ? 'The Poll is Closed 🏁' : 'Live Results ⚡️'}
          </div>
          <h1 className="text-6xl md:text-8xl font-black text-black tracking-tighter leading-none">
            {isClosed ? 'THE VERDICT.' : 'WHO IS WHO?'}
          </h1>
        </div>

        {/* Frenzy AI Section */}
        {isClosed && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-8 duration-700 pb-20">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b-4 border-black pb-8">
              <div className="space-y-2">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-[6px_6px_0px_0px_rgba(79,70,229,0.3)] rotate-3">
                    <Sparkles className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <h2 className="text-5xl font-black italic tracking-tighter text-indigo-600 uppercase">Frenzy AI</h2>
                </div>
                <p className="text-black/40 font-bold text-sm uppercase tracking-widest ml-1 text-center md:text-left">The leaks are out. Nobody is safe.</p>
              </div>

              {isAdmin && (
                <Button
                  onClick={() => setRefreshKey(prev => prev + 1)}
                  disabled={loadingAI}
                  className="bg-indigo-100 text-indigo-600 hover:bg-indigo-600 hover:text-white border-2 border-indigo-600 rounded-2xl font-black px-6 h-12 transition-all active:scale-95 disabled:opacity-50"
                >
                  <RefreshCw className={`w-5 h-5 mr-2 ${loadingAI ? 'animate-spin' : ''}`} />
                  {loadingAI ? 'RE-ANALYZING...' : 'REGENERATE VERDICT'}
                </Button>
              )}
            </div>

            {loadingAI ? (
              <div className="bg-white border-8 border-indigo-100 rounded-[3rem] p-20 text-center space-y-6">
                <div className="relative w-20 h-20 mx-auto">
                  <div className="absolute inset-0 bg-indigo-600 rounded-full animate-ping opacity-20"></div>
                  <div className="relative w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center">
                    <Sparkles className="w-10 h-10 text-white animate-pulse" />
                  </div>
                </div>
                <p className={`font-black text-indigo-600 uppercase tracking-[0.1em] text-xl min-h-[1.5em] flex items-center justify-center transition-all duration-500 ${isStallExiting ? 'opacity-0 scale-95 blur-sm' : 'opacity-100 scale-100 blur-0'}`}>
                  {stallMessage}
                </p>
              </div>
            ) : aiInsights ? (
              <div className="space-y-12">

                {/* Gossip Time - Horizontal Scrollable Cards */}
                {aiInsights.status === 'failed' ? (
                  <div className="bg-red-50 border-4 border-red-100 rounded-[3rem] p-12 text-center space-y-4">
                    <p className="text-red-600 font-black uppercase tracking-widest text-xl">The AI took a coffee break ☕️</p>
                    <p className="text-red-400 font-bold max-w-md mx-auto italic">
                      "Something went wrong while generating the roast. Even the AI couldn't handle your group's chaos. Please try again or refresh."
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex items-center gap-3 ml-2">
                      <Quote className="w-6 h-6 text-indigo-600" />
                      <h3 className="text-2xl font-black tracking-tighter uppercase italic text-black/80">Gossip Time</h3>
                    </div>
                    <div className="flex md:grid md:grid-cols-2 lg:grid-cols-3 overflow-x-auto md:overflow-x-visible pb-8 md:pb-0 gap-8 snap-x snap-mandatory px-2 -mx-2 custom-scrollbar-light">
                      {aiInsights.friendJudgments?.map((j, i) => (
                        <div key={i} className="min-w-[85vw] md:min-w-full snap-center bg-indigo-600 text-white rounded-[2.5rem] p-8 space-y-8 shadow-[10px_10px_0px_0px_#312E81] relative overflow-hidden group">
                          <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20 group-hover:scale-110 transition-transform duration-700" />

                          <div className="space-y-2 relative z-10">
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-200 opacity-80">Character File</p>
                            <h4 className="text-3xl font-black tracking-tighter uppercase">{j.name}</h4>
                          </div>

                          <p className="text-2xl font-bold leading-[1.2] italic relative z-10 min-h-[100px] flex items-center">
                            "{j.judgment}"
                          </p>

                          <div className="pt-4 border-t border-white/20 flex items-center justify-between relative z-10">
                            <span className="text-[10px] font-black uppercase tracking-widest text-white/50">LEAKED BY FRENZY AI</span>
                            <button
                              onClick={() => handleShareRoast(j.name, j.judgment)}
                              className="p-3 bg-white text-indigo-600 rounded-2xl hover:bg-indigo-50 transition-all active:scale-90 shadow-lg"
                            >
                              <Share2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Verdict & Pair Meta */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  <div className="md:col-span-12 lg:col-span-5 bg-white border-8 border-indigo-600 rounded-[3rem] p-10 space-y-6 shadow-[15px_15px_0px_0px_#4F46E5] transform lg:-rotate-1">
                    <div className="flex items-center gap-3 text-indigo-600">
                      <Users className="w-8 h-8" />
                      <h3 className="text-xl font-black uppercase tracking-wider">The Group Verdict</h3>
                    </div>
                    <p className="text-4xl md:text-5xl font-black leading-tight tracking-tighter text-black">
                      {aiInsights.groupVerdict.summary}
                    </p>
                  </div>

                  <div className="md:col-span-12 lg:col-span-7 bg-indigo-50 border-4 border-indigo-100 rounded-[3rem] p-10 space-y-8">
                    <h3 className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400 border-b-2 border-indigo-100 pb-4">Social Dynamics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {aiInsights.pairCommentaries.map((p, i) => (
                        <div key={i} className="flex gap-4 items-start group">
                          <div className="shrink-0 w-10 h-10 rounded-xl bg-white border-2 border-indigo-200 flex items-center justify-center text-xs font-black shadow-sm group-hover:rotate-12 transition-transform">
                            {i + 1}
                          </div>
                          <div className="space-y-1">
                            <span className="block text-[10px] font-black uppercase text-indigo-400 tracking-widest">{p.pair}</span>
                            <p className="text-base font-bold leading-tight text-indigo-950">
                              {p.commentary}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Song Dedications (Spotify) - Optimized Layout */}
                <div className="bg-black text-white rounded-[3.5rem] p-8 md:p-14 space-y-12 shadow-2xl relative overflow-hidden group">
                  <div className="absolute left-0 bottom-0 w-full h-full bg-gradient-to-tr from-indigo-900/40 via-transparent to-transparent pointer-events-none opacity-50" />

                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
                    <div className="space-y-4">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 md:w-20 md:h-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center rotate-3 shadow-[0_0_30px_rgba(79,70,229,0.3)]">
                          <Music className="w-8 h-8 md:w-10 md:h-10 text-white animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <h3 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase whitespace-nowrap leading-none">The Playlist</h3>
                          <p className="text-indigo-400 font-black text-xs md:text-sm uppercase tracking-[0.2em]">SONIC PERSONALITY MATCH</p>
                        </div>
                      </div>
                      <p className="text-white/40 font-bold text-sm md:text-base uppercase tracking-widest max-w-md">
                        The AI analyzed your squad's energy and assigned each person a soul-mate song.
                      </p>
                    </div>
                    <div className="hidden md:flex px-6 py-3 bg-white/5 border border-white/10 text-white/40 rounded-full font-black text-[10px] uppercase tracking-[0.2em] items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-[#1DB954] animate-pulse" />
                      Spotify integration active
                    </div>
                  </div>

                  <div className="flex md:grid md:grid-cols-2 lg:grid-cols-4 overflow-x-auto md:overflow-x-visible pb-8 md:pb-0 gap-6 snap-x snap-mandatory relative z-10 custom-scrollbar-light">
                    {aiInsights.songDedications.map((s, i) => (
                      <a
                        key={i}
                        href={`https://open.spotify.com/search/${encodeURIComponent(`${s.song} ${s.artist}`)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-[85vw] sm:min-w-[320px] md:min-w-full snap-center bg-white/5 border border-white/10 p-8 rounded-[2.5rem] hover:bg-white hover:text-black transition-all duration-500 group/card flex flex-col justify-between gap-10 active:scale-95 min-h-[420px] relative overflow-hidden"
                      >
                        <div className="space-y-6 relative z-10">
                          <div className="flex items-center justify-between">
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest group-hover/card:text-indigo-600 transition-colors uppercase">{s.name}</p>
                            <ExternalLink className="w-4 h-4 opacity-30 group-hover/card:opacity-100 transition-all" />
                          </div>
                          <div className="space-y-2">
                            <h4 className="text-3xl font-black leading-none tracking-tighter">“{s.song}”</h4>
                            <p className="text-base font-bold opacity-60 group-hover/card:opacity-100">{s.artist}</p>
                          </div>
                        </div>

                        <div className="space-y-6 relative z-10">
                          <div className="space-y-4">
                            <div className="inline-flex px-3 py-1 bg-white/10 group-hover/card:bg-black/5 rounded-full">
                              <span className="text-[10px] font-black uppercase tracking-widest italic">{s.vibe}</span>
                            </div>
                            <p className="text-sm font-bold leading-relaxed opacity-50 group-hover/card:opacity-100 italic line-clamp-3">
                              {s.reason}
                            </p>
                          </div>

                          <div className="pt-2">
                            <div className="inline-flex items-center gap-3 bg-[#1DB954] text-black px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-[0.1em] shadow-lg group-hover:scale-105 transition-transform">
                              <Play className="w-3 h-3 fill-black" />
                              <span>Open in Spotify</span>
                            </div>
                          </div>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}

        {/* Share Button (moved and styled) */}
        {isClosed && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 w-[90%] max-w-md z-40 animate-in slide-in-from-bottom-10 duration-1000 delay-500">
            <Button
              onClick={() => {
                const text = encodeURIComponent(`🚨 THE VERDICT IS IN! Frenzy AI just COOKED our squad. See the results and the playlist here: ${window.location.origin}/poll/${pollId}`);
                window.open(`https://wa.me/?text=${text}`, '_blank');
              }}
              className="w-full bg-[#25D366] text-white hover:bg-emerald-600 rounded-[2rem] font-black h-20 text-xl active:scale-95 transition-all flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(37,211,102,0.4)] border-b-8 border-emerald-700"
            >
              <Share2 className="w-6 h-6" />
              DROP IN GROUP CHAT
            </Button>
          </div>
        )}

        {/* Home/Action Links */}
        {!isClosed && (
          <div className="pt-20 flex flex-col items-center gap-4 max-w-sm mx-auto">
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full bg-black text-white hover:bg-black/80 h-16 rounded-[2rem] text-xl font-black transition-all active:scale-95 shadow-xl"
            >
              Create Your Own Poll →
            </Button>
          </div>
        )}

        {/* CSS for custom scrollbars */}
        <style jsx global>{`
            .custom-scrollbar::-webkit-scrollbar {
                height: 6px;
                display: block;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
                margin: 0 20px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
                background: rgba(255, 255, 255, 0.2);
                border-radius: 10px;
            }
            
            .custom-scrollbar-light::-webkit-scrollbar {
                height: 6px;
                display: block;
            }
            .custom-scrollbar-light::-webkit-scrollbar-track {
                background: rgba(255, 255, 255, 0.05);
                border-radius: 10px;
                margin: 0 40px;
            }
            .custom-scrollbar-light::-webkit-scrollbar-thumb {
                background: rgba(79, 70, 229, 0.4);
                border-radius: 10px;
            }

            @media (min-width: 768px) {
                .custom-scrollbar::-webkit-scrollbar,
                .custom-scrollbar-light::-webkit-scrollbar {
                    display: none;
                }
            }
        `}</style>
      </div>
    </div>
  );
}
