/* Stage Stepper — the Salesforce-Path-style chevron bar from the NuptisV2 design system.
   Progression is gated: segments beyond `clickableUpTo` are locked (only "Mark stage
   complete" advances a work order). Clicking a completed segment reviews it. */

export function StageStepper(props: {
  labels: readonly string[];
  current: number; // 1-based actual progress
  viewing?: number; // stage whose content is on screen (defaults to current)
  clickableUpTo?: number; // highest segment that responds to clicks
  resolvedStage?: number; // stage completed via contingency → amber ⚑
  onJump?: (stage: number) => void;
}) {
  const limit = props.clickableUpTo ?? props.current;
  const viewing = props.viewing ?? props.current;
  return (
    <div className="stepper" role="tablist" aria-label="Stages">
      {props.labels.map((label, i) => {
        const n = i + 1;
        const state = n < props.current ? 'done' : n === props.current ? 'current' : 'upcoming';
        const locked = n > limit;
        return (
          <button
            key={label}
            className={`seg ${state} ${locked ? 'locked' : ''} ${viewing === n ? 'viewing' : ''}`}
            disabled={locked}
            onClick={() => !locked && props.onJump?.(n)}
            title={locked ? `Stage ${n}: ${label} — unlocks when the current stage is marked complete` : `Stage ${n}: ${label}`}
          >
            {n < props.current && <span aria-hidden>✓</span>}
            <span className="seg-label">{label}</span>
            {props.resolvedStage === n && <span className="seg-flag" title="Resolved via Contingency">⚑</span>}
          </button>
        );
      })}
    </div>
  );
}

export function MiniStepper({ total, current, amberStage }: { total: number; current: number; amberStage?: number }) {
  return (
    <span className="mini-stepper" title={`Stage ${current} of ${total}`}>
      {Array.from({ length: total }, (_, i) => {
        const n = i + 1;
        const cls = amberStage === n ? 'amber' : n < current ? 'done' : n === current ? 'current' : '';
        return <span key={n} className={`mini-cell ${cls}`} />;
      })}
    </span>
  );
}
