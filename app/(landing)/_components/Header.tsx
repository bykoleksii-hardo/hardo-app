import Link from 'next/link';
import { getViewerPlan } from '@/lib/quota/server';
import { SignOutButton } from '@/app/profile/account/sign-out-button';

export default async function LandingHeader() {
  const { plan } = await getViewerPlan();
  const signedIn = plan !== 'anon';
  return (
    <header className="border-b border-[#f5efe2]/10 bg-[#0a1628]/80 backdrop-blur sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-serif text-2xl tracking-wide text-[#f5efe2]">
          HARDO
        </Link>
        <nav className="flex items-center gap-6 text-sm">
          {signedIn ? (
            <>
              <Link href="/interview/setup" className="text-[#f5efe2]/80 hover:text-[#d4a04a] transition">Start interview</Link>
              <Link href="/profile" className="text-[#f5efe2]/80 hover:text-[#d4a04a] transition">Profile</Link>
              <Link href="/knowledge" className="text-[#f5efe2]/80 hover:text-[#d4a04a] transition hidden sm:inline">Knowledge Hub</Link>
              <SignOutButton />
            </>
          ) : (
            <>
              <Link href="#how" className="text-[#f5efe2]/80 hover:text-[#d4a04a] transition hidden sm:inline">How it works</Link>
              <Link href="#pricing" className="text-[#f5efe2]/80 hover:text-[#d4a04a] transition hidden sm:inline">Pricing</Link>
              <Link href="/knowledge" className="text-[#f5efe2]/80 hover:text-[#d4a04a] transition hidden sm:inline">Knowledge Hub</Link>
              <Link href="/login" className="text-[#0a1628] bg-[#d4a04a] hover:bg-[#d4a04a]/90 px-4 py-2 rounded transition font-medium">Sign in</Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
