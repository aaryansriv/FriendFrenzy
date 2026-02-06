'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { FrenzyCreation } from '@/components/poll-creation';
import { Landing } from '@/components/landing';
import { Suspense } from 'react';

function HomeContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const showCreation = searchParams.get('create') === 'true';
  const manageMode = searchParams.get('manage') === 'true';

  if (showCreation) {
    return <FrenzyCreation onBack={() => router.push('/')} />;
  }

  return (
    <Landing
      initialManageMode={manageMode}
      onStartFrenzy={() => router.push('/?create=true')}
    />
  );
}

export default function Home() {
  return (
    <main className="min-h-screen bg-white">
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center font-bold">Loading Friend Frenzy...</div>}>
        <HomeContent />
      </Suspense>
    </main>
  );
}

