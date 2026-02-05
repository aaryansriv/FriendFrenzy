'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Check } from 'lucide-react';
import { PAIR_FRENZY_QUESTIONS } from '@/lib/questions';

interface Friend {
  id: string;
  name: string;
}

interface Poll {
  id: string;
  questions: string[];
  friends: Friend[];
}

interface VotingInterfaceProps {
  poll: Poll;
  onVotesSubmit: (votes: Record<string, string>) => void;
  isSubmitting: boolean;
}

export function VotingInterface({ poll, onVotesSubmit, isSubmitting }: VotingInterfaceProps) {
  const [selections, setSelections] = useState<Record<string, string>>({});

  const handleSelect = (question: string, friendId: string) => {
    setSelections(prev => ({ ...prev, [question]: friendId }));
  };

  const isComplete = poll.questions.every(q => selections[q]);

  if (!poll) return null;

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
          {poll.questions.map((question, qIdx) => (
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

                  return poll.friends.map(friend => (
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
            onClick={() => onVotesSubmit(selections)}
            disabled={!isComplete || isSubmitting}
            className="bg-black text-white hover:bg-black/80 h-20 px-12 rounded-full text-2xl font-black shadow-2xl disabled:opacity-30 disabled:grayscale transition-all active:scale-95"
          >
            {isSubmitting ? 'Submitting...' : 'Submit All Votes →'}
          </Button>
        </div>
      </div>
    </div>
  );
}
