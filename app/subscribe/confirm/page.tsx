import Link from 'next/link';
import Brand from '@/app/_components/Brand';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type Status = 'success' | 'already' | 'expired' | 'invalid' | 'error';

const COPY: Record<Status, { title: string; body: string; tone: 'ok' | 'warn' | 'err' }> = {
  success:  { title: "You're confirmed.",         body: "Thanks for subscribing. We'll send new rooms and write-ups your way.", tone: 'ok' },
  already:  { title: "Already confirmed.",        body: "This email is already on the list. Nothing more to do.", tone: 'ok' },
  expired:  { title: "Confirmation link expired.", body: "Your confirmation link is older than 24 hours. Subscribe again to receive a fresh link.", tone: 'warn' },
  invalid:  { title: "Confirmation link invalid.", body: "We couldn't find that link. Try subscribing again from the homepage.", tone: 'err' },
  error:    { title: "Something went wrong.",     body: "We couldn't confirm right now. Please try the link again or subscribe again.", tone: 'err' },
};

export default async function ConfirmPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const sp = await searchParams;
  const raw = (sp?.status ?? '') as string;
  const status: Status = (['success','already','expired','invalid','error'] as const).includes(raw as any)
    ? (raw as Status)
    : 'invalid';
  const { title, body, tone } = COPY[status];

  const toneBorder =
    tone === 'ok'   ? 'border-[#1F6F3D]/30 bg-[#1F6F3D]/5'
  : tone === 'warn' ? 'border-[#A85A1F]/30 bg-[#A85A1F]/5'
  :                   'border-[#9C2E2E]/30 bg-[#9C2E2E]/5';

  return (
    <div className="min-h-screen w-full bg-[#FBF7EE] text-[#11161E] flex flex-col">
      <header className="px-8 sm:px-12 py-6">
        <Brand size="md" href="/" />
      </header>
      <main className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="max-w-md w-full">
          <div className={`rounded-md border px-5 py-5 ${toneBorder}`}>
            <div className="text-[15px] font-medium text-[#11161E]">{title}</div>
            <p className="mt-2 text-[13px] leading-relaxed text-[#11161E]/75">{body}</p>
          </div>
          <div className="mt-6 flex items-center gap-3 text-[12px] font-mono uppercase tracking-widest text-[#11161E]/60">
            <Link href="/" className="hover:text-[#11161E] transition-colors">← Back to home</Link>
          </div>
        </div>
      </main>
    </div>
  );
}
