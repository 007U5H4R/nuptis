/* Stage Stepper — the Salesforce-Path-style chevron bar from the NuptisV2 design system. */

export function StageStepper(props: {
  labels: readonly string[];
  current: number; // 1-based
  resolvedStage?: number; // stage completed via contingency → amber corner flag
  onJump?: (stage: number) => void;
}) {
  return (
    <div className="stepper" role="tablist" aria-label="Stages">
      {props.labels.map((label, i) => {
        const n = i + 1;
        const cls = n < props.current ? 'done' : n === props.current ? 'current' : 'upcoming';
        return (
          <button key={label} className={`seg ${cls}`} onClick={() => props.onJump?.(n)} title={`Stage ${n}: ${label}`}>
            {n < props.current && <span aria-hidden>✓</span>}
            <span className="seg-label">{label}</span>
            {props.resolvedStage === n && <span className="flag" title="Resolved via Contingency" />}
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
