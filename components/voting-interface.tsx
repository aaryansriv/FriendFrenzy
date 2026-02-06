'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { PAIR_FRENZY_QUESTIONS } from '@/lib/questions';

interface Friend {
  id: string;
  name: string;
}

interface Frenzy {
  id: string;
  questions: string[];
  friends: Friend[];
}

interface VotingInterfaceProps {
  frenzy: Frenzy;
  onVotesSubmit: (votes: Record<string, string>) => void;
  isSubmitting: boolean;
}

export function VotingInterface({ frenzy, onVotesSubmit, isSubmitting }: VotingInterfaceProps) {
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [confession, setConfession] = useState('');
  const [showConfessionScreen, setShowConfessionScreen] = useState(false);

  const handleSelect = (question: string, friendId: string) => {
    setSelections(prev => ({ ...prev, [question]: friendId }));
  };

  const isComplete = frenzy.questions.every(q => selections[q]);

  if (!frenzy) return null;

  if (showConfessionScreen) {
    return (
      <div className="min-h-screen bg-indigo-600 flex items-center justify-center p-8">
        <div className="max-w-xl w-full bg-white rounded-[3rem] p-10 md:p-14 space-y-10 shadow-2xl animate-in zoom-in duration-500">
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <Quote className="w-8 h-8" />
            </div>
            <h2 className="text-4xl font-black italic tracking-tighter text-black">ANONYMOUS CONFESSION</h2>
            <p className="text-black/60 font-bold leading-tight">
              Have something spicy to say? Share a secret or a thought about anyone.
              This will feed into the AI's final judgment.
            </p>
          </div>

          <div className="space-y-6">
            <textarea
              placeholder="Type your anonymous confession here..."
              value={confession}
              onChange={(e) => setConfession(e.target.value)}
              className="w-full h-48 bg-indigo-50 border-4 border-indigo-100 rounded-[2rem] p-6 font-bold text-lg focus:border-indigo-600 focus:outline-none transition-all placeholder:text-indigo-200 text-black border-none"
            />

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => {
                  (onVotesSubmit as any)(selections, confession);
                }}
                disabled={isSubmitting}
                className="w-full h-16 bg-black text-white hover:bg-black/90 rounded-2xl font-black text-xl shadow-xl active:scale-95 transition-all text-white"
              >
                {isSubmitting ? 'Finalizing...' : 'Submit & Finish →'}
              </Button>
              <button
                onClick={() => {
                  (onVotesSubmit as any)(selections, "");
                }}
                disabled={isSubmitting}
                className="text-[10px] font-black uppercase tracking-[0.2em] text-black/20 hover:text-black transition-colors"
              >
                Skip confession
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col p-8 md:p-12">
      <div className="max-w-6xl mx-auto w-full space-y-12">
        <div className="text-center space-y-4">
          <h1 className="text-5xl font-black">Anonymous Voting</h1>
          <p className="text-xl text-black/60 font-medium tracking-tight">
            Pick which friend fits each question best!
          </p>
        </div>

        {/* 3 x N Grid of Questions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {frenzy.questions.map((question, qIdx) => (
            <div key={qIdx} className="border-4 border-black rounded-3xl p-6 space-y-6 bg-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:translate-y-[-4px] transition-all">
              <h3 className="text-xl font-black leading-tight min-h-[3.5rem]">
                {question}
              </h3>

              <div className="space-y-2">
                {(() => {
                  const tmpl = PAIR_FRENZY_QUESTIONS.find(t => {
                    const regex = new RegExp(t.template.replace('{A}', '.*').replace('{B}', '.*'));
                    return regex.test(question);
                  });

                  if (tmpl) {
                    return (
                      <div className="grid grid-cols-2 gap-2">
                        {tmpl.options.map(opt => (
                          <button
                            key={opt}
                            onClick={() => handleSelect(question, `option:${opt}`)}
                            className={`p-4 rounded-xl font-black border-2 transition-all flex items-center justify-center ${selections[question] === `option:${opt}`
                              ? 'bg-indigo-600 text-white border-indigo-600'
                              : 'bg-white text-black border-black/10 hover:border-black'
                              }`}
                          >
                            {opt}%
                          </button>
                        ))}
                      </div>
                    );
                  }

                  return frenzy.friends.map(friend => (
                    <button
                      key={friend.id}
                      onClick={() => handleSelect(question, friend.id)}
                      className={`w-full p-4 rounded-xl font-bold text-left border-2 transition-all flex items-center justify-between ${selections[question] === friend.id
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-black/10 hover:border-black'
                        }`}
                    >
                      <span>{friend.name}</span>
                      {selections[question] === friend.id && <Check className="w-4 h-4" />}
                    </button>
                  ));
                })()}
              </div>
            </div>
          ))}
        </div>

        <div className="sticky bottom-8 flex justify-center pt-12">
          <Button
            onClick={() => setShowConfessionScreen(true)}
            disabled={!isComplete || isSubmitting}
            className="bg-black text-white hover:bg-black/80 h-20 px-12 rounded-full text-2xl font-black shadow-2xl disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
          >
            {isSubmitting ? 'Submitting...' : 'Next: Confession Time →'}
          </Button>
        </div>
      </div>
    </div>
  );
}

import { Quote } from 'lucide-react';
