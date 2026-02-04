'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';

interface ResultsDisplayProps {
  questions: string[];
  allResults: Record<string, Record<string, number>>;
}

export function ResultsDisplay({ questions, allResults }: ResultsDisplayProps) {
  if (!questions) return null;

  return (
    <div className="min-h-screen bg-[#F8F9FA] p-8 md:p-12">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4">
          <span className="inline-block px-4 py-2 bg-black text-white rounded-full text-sm font-black tracking-widest uppercase">
            Live Results ⚡️
          </span>
          <h1 className="text-5xl md:text-6xl font-black text-black">What Everyone Thinks</h1>
        </div>

        {/* 3 x N Grid of Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {questions.map((question, qIdx) => {
            const currentResults = allResults[question] || {};
            const totalVotes = Object.values(currentResults).reduce((a, b) => a + b, 0);
            const sorted = Object.entries(currentResults)
              .sort(([, a], [, b]) => b - a);

            return (
              <div key={qIdx} className="bg-white border-4 border-black rounded-3xl p-8 space-y-6 shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] flex flex-col">
                <div className="space-y-2">
                  <h3 className="text-2xl font-black leading-tight min-h-[4rem]">
                    {question}
                  </h3>
                  <p className="text-sm font-bold text-black/40">
                    {totalVotes} {totalVotes === 1 ? 'vote' : 'votes'} cast
                  </p>
                </div>

                <div className="space-y-4 flex-1">
                  {sorted.length > 0 ? (
                    sorted.map(([name, votes], idx) => {
                      const percentage = totalVotes > 0 ? (votes / totalVotes) * 100 : 0;
                      const isWinner = idx === 0 && votes > 0;

                      return (
                        <div key={name} className="space-y-2">
                          <div className="flex justify-between items-center text-sm font-bold">
                            <span className="flex items-center gap-2">
                              {name} {isWinner && <Crown className="w-4 h-4 text-yellow-500 fill-current" />}
                            </span>
                            <span>{Math.round(percentage)}%</span>
                          </div>
                          <div className="w-full h-3 bg-black/5 rounded-full overflow-hidden border border-black/10">
                            <div
                              className={`h-full transition-all duration-1000 ${isWinner ? 'bg-black' : 'bg-black/30'}`}
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="h-40 flex items-center justify-center border-2 border-dashed border-black/10 rounded-2xl">
                      <p className="text-black/30 font-bold text-sm">No votes yet</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="pt-12 flex flex-col items-center gap-6 max-w-sm mx-auto">
          <Button
            onClick={() => {
              const text = encodeURIComponent(`Check out the results for this poll! ${window.location.href}`);
              window.open(`https://wa.me/?text=${text}`, '_blank');
            }}
            className="w-full bg-black text-white hover:bg-black/80 rounded-full font-black h-14 text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl"
          >
            <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
              <span className="text-[#25D366] text-xs font-black">W</span>
            </div>
            Share Results on WhatsApp
          </Button>

          <div className="w-full space-y-3">
            <Button
              onClick={() => window.location.href = '/'}
              className="w-full bg-black/[0.05] text-black hover:bg-black hover:text-white h-12 rounded-full text-base font-black transition-all active:scale-95"
            >
              Go to Home Page
            </Button>

            <Button
              onClick={() => window.location.href = '/'}
              className="w-full bg-black text-white hover:bg-black/80 h-16 rounded-full text-xl font-black transition-all active:scale-95 shadow-xl border-b-4 border-black/20"
            >
              Create Your Own Poll →
            </Button>
          </div>
        </div>


      </div>
    </div>
  );
}

import { Crown } from 'lucide-react';

