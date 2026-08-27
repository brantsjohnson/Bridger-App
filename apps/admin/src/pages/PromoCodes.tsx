// ============================================
// WHAT THIS FILE DOES (plain English):
// The "auth codes" page. Here you make a code that gives someone a free year of
// the co-op (no payment), set how many people can use it (the "amount", e.g. 25),
// turn a code off, and see exactly who has used each code. It talks to the API
// at /admin/coop/promo-codes. Only opaque user ids are shown (no names / PII).
// ============================================
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { PageState } from '../components/PageState';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Field } from '../components/ui/Field';
import { api, ApiError } from '../lib/api';

// One promo code as the API returns it.
type PromoCode = {
  id: string;
  code: string;
  label: string;
  grantMonths: number;
  maxRedemptions: number;
  redeemedCount: number;
  remaining: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
};

// One person who redeemed a code (opaque id only).
type Redemption = { userId: string; redeemedAt: string };

export function PromoCodes() {
  const [items, setItems] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // New-code form.
  const [code, setCode] = useState('');
  const [label, setLabel] = useState('');
  const [amount, setAmount] = useState('25');
  const [creating, setCreating] = useState(false);

  // Per-row "who used it" viewer.
  const [openId, setOpenId] = useState<string | null>(null);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [redeemLoading, setRedeemLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<PromoCode[]>('/admin/coop/promo-codes');
      setItems(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to load codes.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // THIS SECTION DOES: create a brand new code with a starting "amount" of uses.
  const onCreate = async (e: FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setSaved(false);
    setError(null);
    try {
      await api<PromoCode>('/admin/coop/promo-codes', {
        method: 'POST',
        body: {
          code: code.trim(),
          label: label.trim() || undefined,
          maxRedemptions: Number(amount) || 0
        }
      });
      setCode('');
      setLabel('');
      setAmount('25');
      setSaved(true);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create code.');
    } finally {
      setCreating(false);
    }
  };

  // THIS SECTION DOES: change a code (new amount, or turn it on/off).
  const patch = async (
    id: string,
    body: { maxRedemptions?: number; active?: boolean }
  ) => {
    setSaved(false);
    setError(null);
    try {
      await api<PromoCode>(`/admin/coop/promo-codes/${id}`, {
        method: 'PATCH',
        body
      });
      setSaved(true);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not update code.');
    }
  };

  // THIS SECTION DOES: load / hide the list of people who used a code.
  const toggleRedemptions = async (id: string) => {
    if (openId === id) {
      setOpenId(null);
      setRedemptions([]);
      return;
    }
    setOpenId(id);
    setRedeemLoading(true);
    try {
      const rows = await api<Redemption[]>(
        `/admin/coop/promo-codes/${id}/redemptions`
      );
      setRedemptions(rows);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : 'Could not load redemptions.'
      );
    } finally {
      setRedeemLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-1 font-pixel text-3xl">Auth codes</h1>
      <p className="mb-6 text-sm text-muted">
        Give someone a free year of the co-op with a code. Set how many people can
        use each code (the amount), turn codes off, and see who redeemed them. No
        payment is taken and only user ids are shown.
      </p>

      <PageState
        loading={loading}
        error={error}
        empty={!loading && items.length === 0}
        emptyMessage="No codes yet. Make one below."
        saved={saved}
        savedMessage="Saved."
      />

      <Card title="New code" className="mb-6">
        <form onSubmit={(e) => void onCreate(e)} className="space-y-4">
          <Field
            id="promo-code"
            label="Code"
            required
            hint="What people type in the app. Not case-sensitive."
            value={code}
            onChange={(e) => setCode(e.target.value)}
          />
          <Field
            id="promo-label"
            label="Label (just for you)"
            hint="A note so you remember what this code is for."
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <Field
            id="promo-amount"
            label="Amount (how many people can use it)"
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
          <Button type="submit" variant="primary" disabled={creating}>
            {creating ? 'Saving…' : 'Create code'}
          </Button>
        </form>
      </Card>

      {!loading && items.length > 0 ? (
        <ul className="space-y-4">
          {items.map((c) => (
            <li key={c.id}>
              <Card>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <h2 className="font-mono text-lg text-ink">{c.code}</h2>
                  <Badge tone={c.active ? 'ok' : 'draft'}>
                    {c.active ? 'active' : 'off'}
                  </Badge>
                </div>

                {c.label ? (
                  <p className="mb-2 text-sm text-muted">{c.label}</p>
                ) : null}

                <p className="mb-3 text-sm text-ink">
                  Used <strong>{c.redeemedCount}</strong> of{' '}
                  <strong>{c.maxRedemptions}</strong> ·{' '}
                  <span className="text-muted">{c.remaining} left</span> · grants{' '}
                  {c.grantMonths} months
                </p>

                {/* Change the amount without deleting the code. */}
                <div className="mb-3 flex flex-wrap items-end gap-2">
                  <label className="text-xs text-muted" htmlFor={`amt-${c.id}`}>
                    New amount
                    <input
                      id={`amt-${c.id}`}
                      type="number"
                      min={0}
                      defaultValue={c.maxRedemptions}
                      className="ml-2 w-24 rounded-lg border border-line bg-surface px-2 py-1 text-sm text-ink"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          const v = Number(
                            (e.target as HTMLInputElement).value
                          );
                          if (!Number.isNaN(v)) {
                            void patch(c.id, { maxRedemptions: v });
                          }
                        }
                      }}
                    />
                  </label>
                  <Button
                    variant="secondary"
                    onClick={() => {
                      const el = document.getElementById(
                        `amt-${c.id}`
                      ) as HTMLInputElement | null;
                      const v = Number(el?.value);
                      if (!Number.isNaN(v)) {
                        void patch(c.id, { maxRedemptions: v });
                      }
                    }}
                  >
                    Save amount
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void patch(c.id, { active: !c.active })}
                  >
                    {c.active ? 'Turn off' : 'Turn on'}
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => void toggleRedemptions(c.id)}
                  >
                    {openId === c.id ? 'Hide who used it' : 'Who used it'}
                  </Button>
                </div>

                {openId === c.id ? (
                  <div className="rounded-lg border border-line p-3">
                    {redeemLoading ? (
                      <p className="text-sm text-muted">Loading…</p>
                    ) : redemptions.length === 0 ? (
                      <p className="text-sm text-muted">
                        Nobody has used this code yet.
                      </p>
                    ) : (
                      <table className="w-full text-left text-sm">
                        <thead>
                          <tr className="border-b border-line text-muted">
                            <th className="py-2 pr-3 font-medium">User id</th>
                            <th className="py-2 font-medium">Redeemed</th>
                          </tr>
                        </thead>
                        <tbody>
                          {redemptions.map((r) => (
                            <tr
                              key={r.userId}
                              className="border-b border-line last:border-0"
                            >
                              <td className="py-2 pr-3 font-mono text-xs text-ink">
                                {r.userId}
                              </td>
                              <td className="py-2 text-muted">
                                {new Date(r.redeemedAt).toLocaleString()}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                ) : null}
              </Card>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
