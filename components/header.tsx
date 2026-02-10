'use client';

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SignInButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs'

export function Header() {
    return (
        <nav className="flex items-center justify-between px-8 py-6 border-b border-black/10 bg-white sticky top-0 z-[100]">
            <Link href="/" className="text-2xl font-black tracking-tight hover:text-black/60 transition">
                FRIEND FRENZY
            </Link>

            <div className="hidden md:flex items-center gap-8">
                <Link href="/" className="text-sm font-bold hover:text-black/60 transition">
                    Home
                </Link>
                <Link href="/?manage=true" className="text-sm font-bold hover:text-black/60 transition">
                    Manage Frenzies
                </Link>
            </div>

            <div className="flex items-center gap-4">
                <SignedOut>
                    <SignInButton mode="modal">
                        <Button
                            variant="outline"
                            className="bg-transparent border-2 border-black text-black hover:bg-black hover:text-white rounded-full px-6 py-2 font-bold transition h-12"
                        >
                            Sign In
                        </Button>
                    </SignInButton>
                </SignedOut>
                <SignedIn>
                    <UserButton />
                </SignedIn>
                <Link href="/?create=true">
                    <Button
                        className="bg-transparent border-2 border-black text-black hover:bg-black hover:text-white rounded-full px-6 py-2 font-bold transition h-12"
                    >
                        Create Frenzy
                    </Button>
                </Link>
            </div>
        </nav>
    );
}
