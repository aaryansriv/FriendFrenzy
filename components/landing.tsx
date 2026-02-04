import { Button } from '@/components/ui/button';
import { ArrowRight, Search, LayoutDashboard, ArrowLeft } from 'lucide-react';
import { HeroCharacters } from '@/components/hero-characters';


import { useEffect, useState } from 'react';

import { Input } from '@/components/ui/input';

interface LandingProps {
  onStartPoll: () => void;
  initialManageMode?: boolean;
}

export function Landing({ onStartPoll, initialManageMode = false }: LandingProps) {
  const [manageMode, setManageMode] = useState(initialManageMode);
  const [searchEmail, setSearchEmail] = useState('');
  const [polls, setPolls] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'closed'>('all');
  const [isSearching, setIsSearching] = useState(false);


  useEffect(() => {
    setManageMode(initialManageMode);
  }, [initialManageMode]);

  const handleSearch = async () => {
    if (!searchEmail.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`/api/creators/polls?email=${encodeURIComponent(searchEmail.trim())}`);

      const data = await res.json();
      setPolls(data.polls || []);
      if (data.polls?.length === 0) alert('No polls found for this name.');
    } catch (err) {
      alert('Search failed');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Content */}

      <div className="flex-1 flex items-center justify-center px-8 py-12">
        {!manageMode ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl w-full items-center">
            {/* Left Content */}
            <div className="space-y-6">
              <h1 className="text-6xl lg:text-7xl font-black leading-tight text-balance">
                Ask What Your Friends Really Think
              </h1>
              <p className="text-xl text-black/60 leading-relaxed max-w-sm">
                Create hilarious anonymous polls about your friends. Get honest answers with game-show style reveals.
              </p>

              <div className="flex gap-4 pt-4">
                <Button
                  onClick={onStartPoll}
                  className="bg-black text-white hover:bg-black/80 rounded-full px-8 py-3 font-semibold flex items-center gap-2 h-14"
                >
                  Start a Poll <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  onClick={() => setManageMode(true)}
                  variant="outline"
                  className="border-2 border-black text-black hover:bg-black/5 rounded-full px-8 py-3 font-semibold bg-transparent h-14"
                >
                  Manage My Polls
                </Button>
              </div>

              {/* Social Links */}
              <div className="flex gap-6 pt-8 text-sm font-medium text-black/60">
                <a href="#" className="hover:text-black transition">LinkedIn</a>
                <a href="#" className="hover:text-black transition">Twitter</a>
                <a href="#" className="hover:text-black transition">Instagram</a>
              </div>
            </div>

            {/* Right Illustration */}
            <div className="relative h-[400px] lg:h-[600px] w-full flex items-center justify-center p-8 lg:p-0 mt-8 lg:mt-0">
              <HeroCharacters />
            </div>


          </div>
        ) : (
          <div className="max-w-2xl w-full space-y-12 relative">


            <div className="text-center space-y-4">

              <h1 className="text-5xl font-black">Manage Your Polls</h1>
              <p className="text-xl text-black/60">Enter your Gmail to see all your active and past polls.</p>
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

              {polls.length > 0 && (
                <div className="space-y-4 pt-8">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-black">Your Polls</h3>
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
                    {polls
                      .filter(p => filterStatus === 'all' || p.status === filterStatus)
                      .map((poll) => (

                        <div key={poll.id} className="border-2 border-black p-6 rounded-3xl flex justify-between items-center bg-black/5">
                          <div className="space-y-1">
                            <p className="font-black text-lg">Created {new Date(poll.created_at).toLocaleDateString()}</p>
                            <p className={`text-sm font-bold uppercase ${poll.status === 'active' ? 'text-green-600' : 'text-red-500'}`}>
                              {poll.status} • {poll.question_set.length} Questions
                            </p>
                          </div>
                          <Button
                            onClick={() => window.location.href = `/poll/${poll.id}/dashboard?token=${poll.admin_token}`}
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
      <div className="bg-black/2 border-t border-black/10 px-8 py-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div>
            <h3 className="text-lg font-bold mb-3">Anonymous Voting</h3>
            <p className="text-black/60">No one knows who voted for who. Complete privacy for honest answers.</p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-3">Multiple Questions</h3>
            <p className="text-black/60">Ask up to 60+ questions about your friends with custom questions too.</p>
          </div>
          <div>
            <h3 className="text-lg font-bold mb-3">Live Results</h3>
            <p className="text-black/60">Watch results update in real-time as votes come in from friends.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

