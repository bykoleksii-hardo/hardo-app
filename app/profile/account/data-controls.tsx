'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/browser';

/**
 * Self-serve GDPR controls: export personal data (art. 20) and permanently
 * delete the account (art. 17).
 */
export function DataControls() {
  const router = useRouter();
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const [showConfirm, setShowConfirm] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const res = await fetch('/api/account/export');
      if (!res.ok) {
        throw new Error('Export failed');
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hardo-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError('Could not export your data. Please try again.');
    } finally {
      setExporting(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch('/api/account/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: 'DELETE' }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Deletion failed');
      }
      // Clear client session and leave the app.
      try {
        await createClient().auth.signOut();
      } catch {
        // ignore — account is already gone
      }
      router.push('/');
      router.refresh();
    } catch (err) {
      setDeleteError(
        err instanceof Error ? err.message : 'Could not delete your account.',
      );
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Export */}
      <div className="flex flex-col gap-2">
        <button
          type="button"
          onClick={handleExport}
          disabled={exporting}
          className="border border-[#11161E]/30 text-[#11161E] tracking-[0.05em] px-6 py-3 rounded-sm hover:border-[#11161E] transition-colors text-[12px] uppercase disabled:opacity-60 self-start"
        >
          {exporting ? 'Preparing…' : 'Download my data'}
        </button>
        {exportError ? (
          <p role="alert" className="text-[11px] text-[#9C2E2E] tracking-[0.04em]">{exportError}</p>
        ) : null}
      </div>

      {/* Delete */}
      <div className="flex flex-col gap-2">
        {!showConfirm ? (
          <button
            type="button"
            onClick={() => setShowConfirm(true)}
            className="border border-[#B0413E]/40 text-[#B0413E] tracking-[0.05em] px-6 py-3 rounded-sm hover:border-[#B0413E] hover:bg-[#B0413E]/5 transition-colors text-[12px] uppercase self-start"
          >
            Delete my account
          </button>
        ) : (
          <div className="flex flex-col gap-3 border border-[#B0413E]/40 rounded-sm p-4 max-w-md">
            <p className="text-[13px] text-[#11161E] leading-relaxed">
              This permanently deletes your account and all your data
              (interviews, feedback, profile). This cannot be undone.
            </p>
            <label className="text-[11px] text-[#11161E]/70 tracking-[0.04em] uppercase">
              Type DELETE to confirm
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="mt-1 block w-full border border-[#11161E]/30 rounded-sm px-3 py-2 text-[13px] tracking-[0.1em] text-[#11161E] focus:border-[#B0413E] outline-none"
                placeholder="DELETE"
                autoComplete="off"
              />
            </label>
            {deleteError ? (
              <p role="alert" className="text-[11px] text-[#9C2E2E] tracking-[0.04em]">{deleteError}</p>
            ) : null}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={handleDelete}
                disabled={confirmText !== 'DELETE' || deleting}
                className="bg-[#B0413E] text-[#FBF7EE] font-medium tracking-[0.05em] px-6 py-3 rounded-sm hover:bg-[#9C2E2E] transition-colors text-[12px] uppercase disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleting ? 'Deleting…' : 'Confirm deletion'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowConfirm(false);
                  setConfirmText('');
                  setDeleteError(null);
                }}
                disabled={deleting}
                className="text-[#11161E]/70 hover:text-[#11161E] transition-colors tracking-[0.05em] text-[12px] uppercase disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
