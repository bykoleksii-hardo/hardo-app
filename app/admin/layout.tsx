import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getUserRole } from '@/lib/auth/roles';
import Brand from '@/app/_components/Brand';

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const role = await getUserRole();
  if (role !== 'admin' && role !== 'editor') {
    redirect('/login?next=/admin/knowledge');
  }

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-paper sticky top-0 z-40">
        <div className="max-w-page mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Brand size="sm" />
            <nav className="flex items-center gap-5 text-[13px] text-ink-2">
              <Link href="/admin/knowledge" className="hover:text-ink">Knowledge</Link>
            </nav>
          </div>
          <div className="flex items-center gap-3 text-[12px] font-mono uppercase tracking-widest text-muted">
            <span>{role}</span>
            <Link href="/" className="hover:text-ink">View site {'\u2192'}</Link>
          </div>
        </div>
      </header>
      <main>{children}</main>
    </div>
  );
}
