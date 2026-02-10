import { Button } from '@/components/ui/button';
import { ArrowRight, Search, LayoutDashboard, ArrowLeft, Sparkles } from 'lucide-react';
import { HeroCharacters } from '@/components/hero-characters';


import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

import { Input } from '@/components/ui/input';

interface LandingProps {
  onStartFrenzy: () => void;
  initialManageMode?: boolean;
}

export function Landing({ onStartFrenzy, initialManageMode = false }: LandingProps) {
  const { user, isLoaded } = useUser();
  const [manageMode, setManageMode] = useState(initialManageMode);
  const [searchEmail, setSearchEmail] = useState('');
  const [frenzies, setFrenzies] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'closed'>('all');
  const [isSearching, setIsSearching] = useState(false);


  useEffect(() => {
    setManageMode(initialManageMode);
  }, [initialManageMode]);

  useEffect(() => {
    if (isLoaded && user && user.primaryEmailAddress?.emailAddress) {
      const email = user.primaryEmailAddress.emailAddress;
      setSearchEmail(email);
      // Auto-search if we just entered manage mode or user just loaded
      if (manageMode) {
        handleSearchWithEmail(email);
      }
    }
  }, [isLoaded, user, manageMode]);

  const handleSearchWithEmail = async (email: string) => {
    if (!email.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/creators/polls?email=${encodeURIComponent(email.trim())}`);
      const data = await res.json();
      setFrenzies(data.polls || []);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = () => handleSearchWithEmail(searchEmail);

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Content */}

      {/* Content */}
      <div className="flex-1 flex items-center justify-center px-8 py-12">
        {!manageMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl w-full items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 bg-indigo-50 border border-indigo-100 px-4 py-2 rounded-full">
                <Sparkles className="w-4 h-4 text-indigo-600" />
                <span className="text-xs font-black uppercase tracking-widest text-indigo-600">Now with Frenzy AI ✨</span>
              </div>
              <h1 className="text-6xl lg:text-7xl font-black leading-tight text-balance">
                The AI That Spills the Tea.
              </h1>
              <p className="text-xl text-black/60 leading-relaxed max-w-sm">
                Host anonymous frenzies, get honest results, and let <strong className="text-indigo-600">Frenzy AI</strong> roast your friend group based on the data.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-4">
                <Button
                  onClick={onStartFrenzy}
                  className="bg-indigo-600 text-white hover:bg-indigo-700 rounded-full px-8 py-3 font-semibold flex items-center gap-2 h-14 shadow-lg shadow-indigo-200"
                >
                  Start a Frenzy <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setManageMode(true)}
                  variant="outline"
                  className="border-2 border-black text-black hover:bg-black/5 rounded-full px-8 py-3 font-semibold bg-transparent h-14"
                >
                  Manage My Frenzies
                </Button>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="relative h-[400px] lg:h-[600px] w-full flex items-center justify-center p-8 lg:p-0 mt-8 lg:mt-0">
              <img
                src="/hero_friends.png"
                alt="Friends having fun"
                className="w-full h-full object-contain max-h-[500px]"
              />
            </div>
          </div>
        ) : (
          <div className="max-w-2xl w-full space-y-12 relative">
            <div className="text-center space-y-4">
              <h1 className="text-5xl font-black">Manage Your Frenzies</h1>
              <p className="text-xl text-black/60">Enter your Gmail to see all your active and past frenzies.</p>
            </div>

            <div className="space-y-6">
              <div className="flex gap-3">
                <Input
                  placeholder="Enter your Gmail (e.g. name@gmail.com)"
                  type="email"
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="h-16 rounded-full border-2 border-black/20 focus:border-black px-8 text-lg"
                />

                <Button
                  onClick={handleSearch}
                  disabled={isSearching}
                  className="bg-black text-white rounded-full px-8 h-16 font-bold"
                >
                  {isSearching ? '...' : <Search className="w-6 h-6" />}
                </Button>
              </div>

              {frenzies.length > 0 && (
                <div className="space-y-4 pt-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black">Your Frenzies</h3>
                    <div className="flex gap-2">
                      {['all', 'active', 'closed'].map((status) => (
                        <button
                          key={status}
                          onClick={() => setFilterStatus(status as any)}
                          className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${filterStatus === status
                            ? 'bg-black text-white'
                            : 'bg-black/5 text-black/60 hover:bg-black/10'
                            }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-4">
                    {frenzies
                      .filter(p => filterStatus === 'all' || p.status === filterStatus)
                      .map((frenzy) => (
                        <div key={frenzy.id} className="border-2 border-black p-6 rounded-3xl flex justify-between items-center bg-black/5 hover:bg-black/10 transition-colors">
                          <div className="space-y-1">
                            <p className="font-black text-lg">Created {new Date(frenzy.created_at).toLocaleDateString()}</p>
                            <p className={`text-sm font-bold uppercase ${frenzy.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                              {frenzy.status} • {frenzy.question_set.length} Questions
                            </p>
                          </div>
                          <Button
                            onClick={() => window.location.href = `/poll/${frenzy.id}/dashboard?token=${frenzy.admin_token}`}
                            className="bg-black text-white rounded-full font-bold px-6"
                          >
                            Dashboard <LayoutDashboard className="w-4 h-4 ml-2" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <button onClick={() => setManageMode(false)} className="w-full text-center text-black/40 font-bold hover:text-black transition">
              ← Back to Home
            </button>
          </div>
        )}
      </div>

      {/* Features Section */}
      <div className="bg-white border-t border-black/5 px-8 py-20 pb-32">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
            <div className="space-y-4 group">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform">
                <ArrowRight className="text-white w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black tracking-tight uppercase">Anonymous</h3>
              <p className="text-black/50 font-medium">No accounts, no names, just honest chaos. 100% privacy for your group's secrets.</p>
            </div>
            <div className="space-y-4 group">
              <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center group-hover:rotate-6 transition-transform shadow-lg shadow-indigo-100">
                <Sparkles className="text-white w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black tracking-tight uppercase text-indigo-600">Frenzy AI</h3>
              <p className="text-black/50 font-medium">Our AI analyzes results to roast your friends, assign group archetypes, and spill the tea.</p>
            </div>
            <div className="space-y-4 group">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center group-hover:-rotate-6 transition-transform">
                <Search className="text-white w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black tracking-tight uppercase">Sonic Vibes</h3>
              <p className="text-black/50 font-medium">Each roast comes with AI-curated song dedications that match your friends' questionable vibes.</p>
            </div>
            <div className="space-y-4 group">
              <div className="w-12 h-12 bg-black rounded-2xl flex items-center justify-center group-hover:-rotate-6 transition-transform">
                <LayoutDashboard className="text-white w-6 h-6" />
              </div>
              <h3 className="text-2xl font-black tracking-tight uppercase">Real-Time</h3>
              <p className="text-black/50 font-medium">Watch the drama unfold live. results update instantly as your friends vote anonymously.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

