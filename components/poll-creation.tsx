'use client';

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Copy, Check, Search, X, LayoutDashboard } from 'lucide-react';

import { createPoll } from '@/lib/api';
import { POLL_QUESTIONS } from '@/lib/questions';

interface PollCreationProps {
  onBack: () => void;
}

export function PollCreation({ onBack }: PollCreationProps) {
  const [step, setStep] = useState<'setup' | 'share'>('setup');
  const [friends, setFriends] = useState<string[]>(['', '', '']);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([POLL_QUESTIONS[0]]);
  const [customQuestion, setCustomQuestion] = useState('');
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [pollId, setPollId] = useState<string>('');
  const [pollLink, setPollLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [pollName, setPollName] = useState('');
  const [email, setEmail] = useState('');



  const addFriend = () => {
    setFriends([...friends, '']);
  };

  const updateFriend = (index: number, name: string) => {
    const updated = [...friends];
    updated[index] = name;
    setFriends(updated);
  };

  const removeFriend = (index: number) => {
    setFriends(friends.filter((_, i) => i !== index));
  };

  const toggleQuestion = (question: string) => {
    setSelectedQuestions((prev) =>
      prev.includes(question)
        ? prev.filter((q) => q !== question)
        : [...prev, question]
    );
  };



  const [adminToken, setAdminToken] = useState('');

  const handleCreatePoll = async () => {
    if (!pollName.trim()) {
      alert('Please enter a poll name');
      return;
    }

    const validFriends = friends.filter((f) => f.trim());
    if (validFriends.length < 2) {
      alert('Please add at least 2 friends');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      alert('Please enter a valid Gmail/Email');
      return;
    }


    const allQuestions = [...selectedQuestions];
    if (customQuestion.trim()) {
      allQuestions.push(customQuestion.trim());
    }

    if (allQuestions.length === 0) {
      alert('Please select at least one question');
      return;
    }

    setIsCreating(true);
    try {
      const result = await createPoll({
        creatorName: pollName.trim(),
        email: email.trim(),
        friends: validFriends,

        questions: allQuestions,
      });

      setPollId(result.id);
      setAdminToken(result.adminToken);
      setPollLink(`${window.location.origin}/poll/${result.id}`);
      setStep('share');
    } catch (err: any) {
      alert(err.message || 'Failed to create poll');
    } finally {
      setIsCreating(false);
    }
  };


  const filteredQuestions = POLL_QUESTIONS.filter((q) =>
    q.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(pollLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (step === 'share') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4 py-12">
        <div className="max-w-xl w-full text-center space-y-8">
          <div className="space-y-4">
            <div className="w-16 h-16 bg-black rounded-full mx-auto flex items-center justify-center">
              <Check className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-4xl font-bold">Poll Created!</h2>
            <p className="text-xl text-black/60">
              Share this link with your friends to collect their anonymous votes
            </p>
          </div>

          <div className="bg-black/5 border-2 border-black rounded-3xl p-6 space-y-4">
            <p className="text-sm font-medium text-black/60">Your unique poll link:</p>
            <div className="flex gap-2">
              <Input
                value={pollLink}
                readOnly
                className="bg-white border-2 border-black rounded-full px-4 text-black font-medium"
              />
              <Button
                onClick={copyToClipboard}
                className="bg-black text-white hover:bg-black/80 rounded-full px-4 flex-shrink-0"
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </Button>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  const text = encodeURIComponent(`Vote on our squad's anonymous poll! ${pollLink}`);
                  window.open(`https://wa.me/?text=${text}`, '_blank');
                }}
                className="w-full bg-black text-white hover:bg-black/80 rounded-full font-black h-14 text-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 shadow-xl"
              >
                <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center">
                  <span className="text-[#25D366] text-xs font-black">W</span>
                </div>
                Share on WhatsApp
              </Button>
            </div>
          </div>


          <div className="space-y-4">
            {/* Dashboard Link Section */}
            <div className="p-6 bg-black text-white rounded-[2rem] space-y-4 shadow-2xl">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-tighter">
                  Admin Dashboard
                </h2>
                <span className="text-[10px] font-black bg-white/20 px-2 py-0.5 rounded-full uppercase">Private</span>
              </div>
              <p className="text-white/60 text-xs font-bold leading-relaxed">
                Save this link! Use it to manage your poll, check results, and declare winners.
              </p>
              <div className="pt-2 flex gap-3">
                <Button
                  onClick={() => {
                    window.location.href = `/poll/${pollId}/dashboard?token=${adminToken}`;
                  }}
                  className="flex-1 bg-white text-black hover:bg-white/90 rounded-full font-black h-12 text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/poll/${pollId}/dashboard?token=${adminToken}`);
                    alert('Dashboard link copied!');
                  }}
                  variant="outline"
                  className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-full px-6 font-black h-12 text-sm transition-all active:scale-95"
                >
                  Copy Link
                </Button>
              </div>
            </div>



            <div className="pt-4 space-y-3">
              <Button
                onClick={() => (window.location.href = `/poll/${pollId}`)}
                className="w-full bg-black text-white hover:bg-black/80 h-16 rounded-full text-xl font-black transition-all shadow-xl active:scale-95 border-b-4 border-black/20"
              >
                Go to Poll Page
              </Button>

              <Button
                onClick={onBack}
                className="w-full border-4 border-black text-black hover:bg-black/5 bg-white h-14 text-lg font-black rounded-full transition-all active:scale-95"
                variant="outline"
              >
                Create Another Poll
              </Button>
            </div>

          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Main Content */}

      <div className="flex-1 flex items-center justify-center px-8 py-12">
        <div className="max-w-5xl w-full space-y-10">
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Poll Name</h2>
                <p className="text-black/60">Something catchy for your squad</p>
                <Input
                  placeholder="e.g. Squad2024"
                  value={pollName}
                  onChange={(e) => setPollName(e.target.value)}
                  className="bg-white border-2 border-black/20 rounded-full px-6 h-14 focus:border-black placeholder-black/40 text-black"
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Your Gmail</h2>
                <p className="text-black/60">Used to manage all your polls</p>
                <Input
                  placeholder="name@gmail.com"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-white border-2 border-black/20 rounded-full px-6 h-14 focus:border-black placeholder-black/40 text-black"
                />
              </div>
            </div>
          </div>



          {/* Friends Section */}

          <div className="space-y-6">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold">Add Your Friends</h2>
              <p className="text-black/60">Add at least 2 friends to get started</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {friends.map((friend, index) => (
                <div key={index} className="relative group">
                  <Input
                    placeholder={`Friend ${index + 1}`}
                    value={friend}
                    onChange={(e) => updateFriend(index, e.target.value)}
                    className="bg-white border-2 border-black/20 rounded-full px-6 h-14 focus:border-black placeholder-black/40 text-black pr-12 transition-all"
                  />
                  {friends.length > 1 && (
                    <button
                      onClick={() => removeFriend(index)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 shadow-lg"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}

              <Button
                onClick={addFriend}
                variant="outline"
                className="h-14 border-2 border-dashed border-black/20 text-black/40 hover:text-black hover:border-black bg-transparent rounded-full font-bold flex items-center justify-center gap-2 transition-all"
              >
                <Plus className="w-5 h-5" />
                Add Friend
              </Button>
            </div>
          </div>


          {/* Questions Section */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-2xl font-bold">Select Questions</h2>
                <p className="text-black/60">Choose from 60+ questions or add your own</p>
              </div>
              <span className="text-sm font-black bg-black text-white px-4 py-1 rounded-full uppercase tracking-widest">
                {selectedQuestions.length} selected
              </span>
            </div>

            <div className="bg-transparent rounded-[2.5rem]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {/* Selected Questions as Cards */}
                {selectedQuestions.map((q) => (
                  <div
                    key={q}
                    className="group relative bg-black/[0.08] border-2 border-black/5 rounded-[2rem] p-6 shadow-sm hover:bg-black/[0.12] transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[140px]"
                  >
                    <p className="text-sm font-black text-black leading-snug pr-8">
                      {q}
                    </p>
                    <button
                      onClick={() => toggleQuestion(q)}
                      className="absolute top-4 right-4 w-8 h-8 bg-black/10 hover:bg-black text-black/60 hover:text-white rounded-full flex items-center justify-center transition-all shadow-sm"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {/* Custom Question as a Card */}
                <div className="relative bg-black/[0.08] border-2 border-black/5 rounded-[2rem] p-6 shadow-sm focus-within:bg-black/[0.12] focus-within:border-black/20 transition-all flex flex-col justify-between min-h-[140px]">
                  <p className="text-[10px] font-black uppercase tracking-widest text-black/30 mb-auto">Custom Question</p>
                  <Input
                    placeholder="Ask anything..."
                    value={customQuestion}
                    onChange={(e) => setCustomQuestion(e.target.value)}
                    className="bg-transparent border-0 border-b-2 border-black/20 rounded-none px-0 h-10 focus:ring-0 focus:border-black placeholder-black/30 text-sm font-bold w-full"
                  />
                </div>

                {/* Question Picker Card (The 'Add More' button) */}
                <button
                  onClick={() => setShowQuestionModal(true)}
                  className="bg-black/[0.04] border-2 border-dashed border-black/20 rounded-[2rem] p-6 flex flex-col items-center justify-center gap-3 text-black/40 hover:text-black hover:border-black hover:bg-black/[0.08] transition-all min-h-[140px]"
                >
                  <div className="w-12 h-12 rounded-full border-2 border-current flex items-center justify-center">
                    <Plus className="w-6 h-6" />
                  </div>
                  <span className="font-black text-[10px] uppercase tracking-widest">Add More</span>
                </button>
              </div>
            </div>


          </div>

          {/* Create Button */}
          <div className="pt-8 pb-12">
            <Button
              onClick={handleCreatePoll}
              disabled={isCreating}
              className="w-full bg-black text-white hover:bg-black/80 py-8 text-2xl font-black rounded-full disabled:opacity-60 shadow-xl transition-all active:scale-[0.98]"
            >
              {isCreating ? 'Creating Poll...' : 'Create Poll'}
            </Button>
          </div>
        </div>
      </div>

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 md:p-12 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] max-w-lg md:max-w-5xl w-full max-h-[80vh] md:max-h-[90vh] overflow-hidden flex flex-col border-4 border-black shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)]">
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b-4 border-black flex items-center justify-between bg-black text-white">
              <div className="space-y-1">
                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter">The Vault</h3>
                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest hidden md:block">Hand-picked for maximum chaos</p>
              </div>

              <button
                onClick={() => {
                  setShowQuestionModal(false);
                  setSearchQuery('');
                }}
                className="w-12 h-12 bg-white/10 hover:bg-white text-white hover:text-black rounded-full flex items-center justify-center transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Questions List */}
            <div className="overflow-y-auto flex-1 p-6 md:p-10 bg-[#F8F9FA]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {POLL_QUESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => toggleQuestion(q)}
                    className={`w-full text-left p-6 rounded-[2rem] border-4 transition-all font-bold text-base md:text-lg min-h-[100px] flex items-center ${selectedQuestions.includes(q)
                      ? 'bg-black text-white border-black scale-[0.98]'
                      : 'bg-white text-black border-black/10 hover:border-black hover:bg-black/5'
                      }`}
                  >
                    <div className="flex items-center gap-4 w-full">
                      <div
                        className={`w-6 h-6 rounded-full border-4 flex-shrink-0 flex items-center justify-center transition-all ${selectedQuestions.includes(q)
                          ? 'bg-white border-white'
                          : 'bg-white border-black/20'
                          }`}
                      >
                        {selectedQuestions.includes(q) && (
                          <Check className="w-4 h-4 text-black" />
                        )}
                      </div>
                      <span className="flex-1 leading-tight">{q}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>


            {/* Modal Footer */}
            <div className="p-8 border-t-4 border-black bg-white">
              <Button
                onClick={() => {
                  setShowQuestionModal(false);
                  setSearchQuery('');
                }}
                className="w-full bg-black text-white hover:bg-black/80 h-16 text-xl font-black rounded-full"
              >
                Done ({selectedQuestions.length} selected)
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

