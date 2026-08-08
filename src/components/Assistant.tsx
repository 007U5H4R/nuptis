import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

interface Msg {
  role: 'bot' | 'user';
  text: string;
  action?: { label: string; route: string };
}

const WELCOME =
  'Hi Meraki! I’m your Nuptis guide. Ask me about onboarding steps, procurement stages, payments — or what to do when something goes wrong on the day.';

const SUGGESTIONS = ['What if a vendor no-shows?', 'How do I onboard a caterer?', 'Explain milestone payments'];

function answer(q: string): Msg {
  const s = q.toLowerCase();
  if (s.includes('no-show') || s.includes('no show') || s.includes('unreachable') || s.includes('backup')) {
    return {
      role: 'bot',
      text:
        'Here’s the play:\n1  The Day-of monitor flags the no-show — a risk flag opens on the work order.\n2  Open the Contingency Panel — the flag lists its pre-vetted Backup-tier vendors with compliance current.\n3  Activate Backup — the penalty clause (2× advance) fires automatically and the SLA re-locks.\nNothing is sourced cold on the day — that’s the whole point of Backup tier.',
      action: { label: 'Open Contingency Panel →', route: '/contingency' },
    };
  }
  if (s.includes('onboard') || s.includes('caterer') || s.includes('vendor') || s.includes('intake')) {
    return {
      role: 'bot',
      text:
        'Onboarding is a 5-step intake:\n1  Category & risk tier (caterers are High risk)\n2  Document checklist — High risk needs FSSAI, insurance and police verification\n3  Reference / trial check\n4  Rate card & terms\n5  Contract & empanelment → the vendor publishes straight to your roster.',
      action: { label: 'Start an intake →', route: '/onboarding' },
    };
  }
  if (s.includes('payment') || s.includes('milestone') || s.includes('advance') || s.includes('settle')) {
    return {
      role: 'bot',
      text:
        'Payments are milestone-based:\n·  Advance — 30% on booking confirmation\n·  Pre-event — cleared before day-of\n·  Settlement — after reconciliation\nIf a vendor no-shows, the penalty clause recovers 2× the advance automatically.',
      action: { label: 'Open Payment Tracker →', route: '/payments' },
    };
  }
  if (s.includes('stage') || s.includes('procurement')) {
    return {
      role: 'bot',
      text:
        'Every work order moves through 8 stages: Requirements → Shortlist → Quote & Negotiation → Booking → Pre-Event → Payments → Day-Of → Settlement. Only the current stage’s action advances it; stages resolved via the Contingency Panel carry an amber corner flag.',
      action: { label: 'Open Procurement Board →', route: '/procurement' },
    };
  }
  return {
    role: 'bot',
    text: 'I can guide you through vendor onboarding, the 8 procurement stages, milestone payments, and day-of contingency handling. Try one of the suggested questions below.',
  };
}

export function Assistant({ open, onOpen, onClose }: { open: boolean; onOpen: () => void; onClose: () => void }) {
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs, open]);

  const ask = (q: string) => {
    setMsgs((m) => [...m, { role: 'user', text: q }, answer(q)]);
    setInput('');
  };

  return (
    <>
      {!open && (
        <button className="orb" onClick={onOpen} title="Nuptis Assistant" aria-label="Open Nuptis Assistant" />
      )}
      {open && (
        <aside className="assist-panel" role="dialog" aria-label="Nuptis Assistant">
          <div className="assist-head">
            <span className="mini-orb" />
            <div>
              <div className="assist-title">Nuptis Assistant</div>
              <div className="assist-sub">Process guide · answers from your workflow</div>
            </div>
            <button className="assist-close" onClick={onClose} aria-label="Close assistant">✕</button>
          </div>
          <div className="assist-msgs">
            <div className="bubble bot">{WELCOME}</div>
            {msgs.length === 0 && (
              <>
                <div className="overline">Suggested</div>
                <div className="chips">
                  {SUGGESTIONS.map((s) => (
                    <button key={s} className="chip" onClick={() => ask(s)}>{s}</button>
                  ))}
                </div>
              </>
            )}
            {msgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: m.role === 'user' ? 'flex-end' : 'flex-start', gap: 8 }}>
                <div className={`bubble ${m.role}`}>{m.text}</div>
                {m.action && (
                  <button
                    className="chip action"
                    onClick={() => {
                      navigate(m.action!.route);
                      onClose();
                    }}
                  >
                    {m.action.label}
                  </button>
                )}
              </div>
            ))}
            <div ref={endRef} />
          </div>
          <form
            className="assist-input"
            onSubmit={(e) => {
              e.preventDefault();
              if (input.trim()) ask(input.trim());
            }}
          >
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask about any stage…" />
            <button className="btn btn-primary" type="submit">Send</button>
          </form>
        </aside>
      )}
    </>
  );
}
