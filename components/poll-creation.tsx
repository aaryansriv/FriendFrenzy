'use client';

import { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Plus, Copy, Check, Search, X, LayoutDashboard } from 'lucide-react';

import { createFrenzy } from '@/lib/api';
import { QUESTION_BANK, QuestionCategory, PAIR_FRENZY_QUESTIONS } from '@/lib/questions';

type Friend = {
  name: string;
  gender: 'male' | 'female' | 'lesbian' | 'gay' | 'bisexual' | '';
};

interface FrenzyInputProps {
  label: string;
  value: string;
  field: 'a' | 'b';
  friends: Friend[];
  onUpdate: (val: string) => void;
}

const FrenzyInputBox = ({ label, value = '', field, friends, onUpdate }: FrenzyInputProps) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const safeValue = value || '';

  const matchingFriend = friends.find(f =>
    f.name &&
    f.name.toLowerCase() === safeValue.toLowerCase() &&
    f.name.trim() !== ''
  );
  const gender = matchingFriend?.gender;

  const getStyles = () => {
    if (gender === 'male') return 'border-[#60A5FA] bg-[#EFF6FF] text-[#1E40AF]';
    if (gender === 'female') return 'border-[#F472B6] bg-[#FFF1F2] text-[#9D174D]';
    return 'border-black bg-white text-black';
  };

  const suggestions = friends.filter(f =>
    f.name &&
    f.name.trim() !== '' &&
    f.name.toLowerCase().includes(safeValue.toLowerCase()) &&
    f.name.toLowerCase() !== safeValue.toLowerCase()
  );

  return (
    <div className="relative flex-1">
      <p className="text-[10px] font-extrabold uppercase text-black/40 px-3 mb-1 tracking-widest">{label}</p>
      <div className="relative">
        <Input
          placeholder="Name..."
          value={value}
          onChange={(e) => {
            onUpdate(e.target.value);
            setShowSuggestions(true);
          }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className={`h-12 rounded-2xl border-4 transition-all px-4 text-sm font-black focus:ring-0 ${getStyles()}`}
        />
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-[400] top-full left-0 right-0 mt-2 bg-white border-4 border-black rounded-2xl overflow-hidden shadow-2xl max-h-40 overflow-y-auto">
            {suggestions.map(f => (
              <button
                key={f.name}
                type="button"
                onMouseDown={(e) => {
                  // Use onMouseDown to trigger before onBlur
                  e.preventDefault();
                  onUpdate(f.name);
                  setShowSuggestions(false);
                }}
                className="w-full text-left px-4 py-3 text-xs font-black hover:bg-black hover:text-white transition-colors flex items-center justify-between border-b last:border-b-0 border-black/5"
              >
                <span>{f.name}</span>
                <span className={`text-[8px] px-2 py-0.5 rounded-full ${f.gender === 'male' ? 'bg-blue-100 text-blue-600' :
                  f.gender === 'female' ? 'bg-pink-100 text-pink-600' :
                    'bg-black/10 text-black/40'
                  }`}>
                  {f.gender}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

interface FrenzyCreationProps {
  onBack: () => void;
}

export function FrenzyCreation({ onBack }: FrenzyCreationProps) {
  const [step, setStep] = useState<'setup' | 'share'>('setup');
  const [friends, setFriends] = useState<Friend[]>([
    { name: '', gender: '' },
    { name: '', gender: '' },
    { name: '', gender: '' }
  ]);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<QuestionCategory>(QuestionCategory.PARTY_SOCIAL);
  const [frenzyInputs, setFrenzyInputs] = useState<Record<string, { a: string, b: string }>>({});
  const [customQuestion, setCustomQuestion] = useState('');
  const [showQuestionModal, setShowQuestionModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [frenzyId, setFrenzyId] = useState<string>('');
  const [frenzyLink, setFrenzyLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [frenzyName, setFrenzyName] = useState('');
  const [email, setEmail] = useState('');



  const addFriend = () => {
    setFriends([...friends, { name: '', gender: '' }]);
  };

  const updateFriend = (index: number, updates: Partial<Friend>) => {
    const updated = [...friends];
    updated[index] = { ...updated[index], ...updates };
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

  const updateFrenzyInput = (template: string, key: 'a' | 'b', value: string) => {
    setFrenzyInputs(prev => {
      const current = prev[template] || { a: '', b: '' };
      return {
        ...prev,
        [template]: { ...current, [key]: value }
      };
    });
  };

  const addFrenzyQuestion = (template: string) => {
    const inputs = frenzyInputs[template] || { a: '', b: '' };
    if (!inputs.a.trim() || !inputs.b.trim()) {
      alert('Please provide names for both {A} and {B}');
      return;
    }
    const finalized = template.replace('{A}', inputs.a.trim()).replace('{B}', inputs.b.trim());
    if (!selectedQuestions.includes(finalized)) {
      setSelectedQuestions(prev => [...prev, finalized]);
    }
    // Optional: clear inputs
    setFrenzyInputs(prev => ({
      ...prev,
      [template]: { a: '', b: '' }
    }));
  };



  const [adminToken, setAdminToken] = useState('');

  const handleCreateFrenzy = async () => {
    if (!frenzyName.trim()) {
      alert('Please enter a frenzy name');
      return;
    }

    const validFriends = friends.filter((f) => f.name.trim() && f.gender);
    if (validFriends.length < 2) {
      alert('Please add at least 2 friends with genders');
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
      const result = await createFrenzy({
        creatorName: frenzyName.trim(),
        email: email.trim(),
        friends: validFriends.map(f => ({ name: f.name.trim(), gender: f.gender })),
        questions: allQuestions,
      });

      setFrenzyId(result.id);
      setAdminToken(result.adminToken);
      setFrenzyLink(`${window.location.origin}/poll/${result.id}`);
      setStep('share');
    } catch (err: any) {
      alert(err.message || 'Failed to create frenzy');
    } finally {
      setIsCreating(false);
    }
  };


  const filteredQuestions = (QUESTION_BANK[activeCategory] || []).filter((q: any) => {
    const text = typeof q === 'string' ? q : q.template;
    return text.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(frenzyLink);
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
            <h2 className="text-4xl font-bold">Frenzy Created!</h2>
            <p className="text-xl text-black/60">
              Share this link with your friends to collect their anonymous votes
            </p>
          </div>

          <div className="bg-black/5 border-2 border-black rounded-3xl p-6 space-y-4">
            <p className="text-sm font-medium text-black/60">Your unique frenzy link:</p>
            <div className="flex gap-2">
              <Input
                value={frenzyLink}
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
                  const text = encodeURIComponent(`Vote on our squad's anonymous frenzy! ${frenzyLink}`);
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
                    window.location.href = `/poll/${frenzyId}/dashboard?token=${adminToken}`;
                  }}
                  className="flex-1 bg-white text-black hover:bg-white/90 rounded-full font-black h-12 text-sm transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <LayoutDashboard className="w-4 h-4" />
                  Go to Dashboard
                </Button>
                <Button
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}/poll/${frenzyId}/dashboard?token=${adminToken}`);
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
                onClick={() => (window.location.href = `/poll/${frenzyId}`)}
                className="w-full bg-black text-white hover:bg-black/80 h-16 rounded-full text-xl font-black transition-all shadow-xl active:scale-95 border-b-4 border-black/20"
              >
                Go to Frenzy Page
              </Button>

              <Button
                onClick={onBack}
                className="w-full border-4 border-black text-black hover:bg-black/5 bg-white h-14 text-lg font-black rounded-full transition-all active:scale-95"
                variant="outline"
              >
                Create Another Frenzy
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
                <h2 className="text-2xl font-bold">Frenzy Name</h2>
                <p className="text-black/60">Something catchy for your squad</p>
                <Input
                  placeholder="e.g. Squad2024"
                  value={frenzyName}
                  onChange={(e) => setFrenzyName(e.target.value)}
                  className="bg-white border-2 border-black/20 rounded-full px-6 h-14 focus:border-black placeholder-black/40 text-black"
                />
              </div>

              <div className="space-y-4">
                <h2 className="text-2xl font-bold">Your Gmail</h2>
                <p className="text-black/60">Used to manage all your frenzies</p>
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
                <div key={index} className="space-y-2 p-4 border-2 border-black/5 rounded-[2rem] bg-black/[0.02]">
                  <div className="relative group">
                    <Input
                      placeholder={`Friend ${index + 1} Name`}
                      value={friend.name}
                      onChange={(e) => updateFriend(index, { name: e.target.value })}
                      className="bg-white border-2 border-black/20 rounded-full px-6 h-12 focus:border-black placeholder-black/40 text-black pr-12 transition-all"
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
                  <div className="flex flex-wrap gap-1">
                    {['male', 'female', 'lesbian', 'gay', 'bisexual'].map((g) => (
                      <button
                        key={g}
                        onClick={() => updateFriend(index, { gender: g as any })}
                        className={`text-[10px] px-2 py-1 rounded-full font-black uppercase transition-all border-2 ${friend.gender === g
                          ? 'bg-black text-white border-black'
                          : 'bg-white text-black/40 border-black/10 hover:border-black/20'
                          }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
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
                {selectedQuestions.map((q) => {
                  // Check if it's a Pair Frenzy question based on template patterns
                  const isPairFrenzy = PAIR_FRENZY_QUESTIONS.some(tmpl => {
                    const regex = new RegExp(tmpl.template.replace('{A}', '.*').replace('{B}', '.*'));
                    return regex.test(q);
                  });

                  return (
                    <div
                      key={q}
                      className={`group relative border-2 rounded-[2rem] p-6 shadow-sm transition-all hover:scale-[1.02] flex flex-col justify-between min-h-[140px] ${isPairFrenzy
                        ? 'bg-indigo-50 border-indigo-200'
                        : 'bg-black/[0.08] border-black/5 hover:bg-black/[0.12]'
                        }`}
                    >
                      <div className="flex flex-col gap-1">
                        {isPairFrenzy && <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Pair Frenzy</span>}
                        <p className={`text-sm font-black leading-snug pr-8 ${isPairFrenzy ? 'text-indigo-900' : 'text-black'}`}>
                          {q}
                        </p>
                      </div>
                      <button
                        onClick={() => toggleQuestion(q)}
                        className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center transition-all shadow-sm ${isPairFrenzy
                          ? 'bg-indigo-200 hover:bg-indigo-500 text-indigo-600 hover:text-white'
                          : 'bg-black/10 hover:bg-black text-black/60 hover:text-white'
                          }`}
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}

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
              onClick={handleCreateFrenzy}
              disabled={isCreating}
              className="w-full bg-black text-white hover:bg-black/80 py-8 text-2xl font-black rounded-full disabled:opacity-60 shadow-xl transition-all active:scale-[0.98]"
            >
              {isCreating ? 'Creating Frenzy...' : 'Create Frenzy'}
            </Button>
          </div>
        </div>
      </div>

      {/* Question Modal */}
      {showQuestionModal && (
        <div className="fixed inset-0 bg-black/60 z-[200] flex items-center justify-center p-4 md:p-12 backdrop-blur-md">
          <div className="bg-white rounded-[2rem] max-w-lg md:max-w-5xl w-full max-h-[80vh] md:max-h-[90vh] overflow-hidden flex flex-col border-4 border-black shadow-[0_32px_64px_-12px_rgba(0,0,0,0.6)]">
            {/* Modal Header */}
            <div className="p-6 md:p-8 border-b-4 border-black flex flex-col gap-6 bg-black text-white">
              <div className="flex items-center justify-between">
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

              {/* Categories */}
              <div className="flex flex-wrap gap-2">
                {[
                  { id: QuestionCategory.PARTY_SOCIAL, label: 'Party Social' },
                  { id: QuestionCategory.NAUGHTY_18_PLUS, label: 'Naughty' },
                  { id: QuestionCategory.MIXED, label: 'Mixed' },
                  { id: QuestionCategory.PAIR_FRENZY, label: 'Pair Frenzy (Interesting)' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`px-4 py-2 rounded-full text-xs font-black uppercase tracking-widest transition-all ${activeCategory === cat.id
                      ? 'bg-white text-black'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                      }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Questions List */}
            <div className="overflow-y-auto flex-1 p-4 md:p-10 bg-[#F8F9FA]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredQuestions.map((q: any) => {
                  const isPairFrenzy = activeCategory === QuestionCategory.PAIR_FRENZY;
                  const text = isPairFrenzy ? q.template : q;
                  const isSelected = !isPairFrenzy && selectedQuestions.includes(text);

                  if (isPairFrenzy) {
                    const inputs = frenzyInputs[text] || { a: '', b: '' };

                    return (
                      <div
                        key={text}
                        className="w-full text-left p-5 md:p-8 rounded-[2.5rem] border-4 bg-white border-black/10 flex flex-col gap-6 shadow-sm"
                      >
                        <div className="space-y-2">
                          <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full">Pair Template</span>
                          <p className="text-lg md:text-xl font-black leading-snug text-black">{text}</p>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-4">
                          <FrenzyInputBox
                            label="{A}"
                            value={inputs.a}
                            field="a"
                            friends={friends}
                            onUpdate={(val) => updateFrenzyInput(text, 'a', val)}
                          />
                          <FrenzyInputBox
                            label="{B}"
                            value={inputs.b}
                            field="b"
                            friends={friends}
                            onUpdate={(val) => updateFrenzyInput(text, 'b', val)}
                          />
                        </div>

                        <Button
                          onClick={() => addFrenzyQuestion(text)}
                          className="bg-black text-white hover:bg-black/90 rounded-2xl h-14 text-sm font-black uppercase tracking-widest mt-2 active:scale-95 transition-all shadow-xl"
                        >
                          Add to Frenzy +
                        </Button>
                      </div>
                    );
                  }

                  return (
                    <button
                      key={text}
                      onClick={() => toggleQuestion(text)}
                      className={`w-full text-left p-6 rounded-[2rem] border-4 transition-all font-bold text-base md:text-lg min-h-[100px] flex items-center ${isSelected
                        ? 'bg-black text-white border-black scale-[0.98]'
                        : 'bg-white text-black border-black/10 hover:border-black hover:bg-black/5'
                        }`}
                    >
                      <div className="flex items-center gap-4 w-full">
                        <div
                          className={`w-6 h-6 rounded-full border-4 flex-shrink-0 flex items-center justify-center transition-all ${isSelected
                            ? 'bg-white border-white'
                            : 'bg-white border-black/20'
                            }`}
                        >
                          {isSelected && (
                            <Check className="w-4 h-4 text-black" />
                          )}
                        </div>
                        <span className="flex-1 leading-tight">{text}</span>
                      </div>
                    </button>
                  );
                })}
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

