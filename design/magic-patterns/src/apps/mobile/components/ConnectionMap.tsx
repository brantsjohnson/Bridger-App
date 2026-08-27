import { Person } from '../../../packages/shared';
import { ACCENTS } from '../../../packages/ui';
import { ME } from '../state/mock-data';

type Node = {id: string;label: string;x: number;y: number;person: Person;};
type Edge = {from: string;to: string;dashed?: boolean;label?: string;};

/**
 * Map A — you, your mutual friend (middle), the person to meet.
 * Map B — after connecting: cross-introductions on both sides.
 */
export function ConnectionMap({
  person,
  via,
  variant = 'A',
  crossA,
  crossB






}: {person: Person;via: Person;variant?: 'A' | 'B';crossA?: Person;crossB?: Person;}) {
  const nodes: Node[] =
  variant === 'A' ?
  [
  { id: 'me', label: 'You', x: 42, y: 90, person: ME },
  { id: via.id, label: via.name.split(' ')[0], x: 150, y: 90, person: via },
  { id: person.id, label: person.name.split(' ')[0], x: 258, y: 90, person }] :

  [
  { id: 'me', label: 'You', x: 60, y: 50, person: ME },
  { id: person.id, label: person.name.split(' ')[0], x: 240, y: 50, person },
  ...(crossA ? [{ id: crossA.id, label: crossA.name.split(' ')[0], x: 240, y: 145, person: crossA }] : []),
  ...(crossB ? [{ id: crossB.id, label: crossB.name.split(' ')[0], x: 60, y: 145, person: crossB }] : [])];


  const edges: Edge[] =
  variant === 'A' ?
  [
  { from: 'me', to: via.id },
  { from: via.id, to: person.id },
  { from: 'me', to: person.id, dashed: true }] :

  [
  { from: 'me', to: person.id },
  ...(crossA ? [{ from: person.id, to: crossA.id }, { from: 'me', to: crossA.id, dashed: true }] : []),
  ...(crossB ? [{ from: 'me', to: crossB.id }, { from: crossB.id, to: person.id, dashed: true }] : [])];


  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));

  return (
    <div className="rounded-card border border-ink-line bg-white p-3 text-ink">
      <svg viewBox="0 0 300 190" className="h-[190px] w-full" role="img" aria-label="Connection map">
        {edges.map((e) => {
          const a = byId[e.from];
          const b = byId[e.to];
          if (!a || !b) return null;
          return (
            <line
              key={`${e.from}-${e.to}`}
              x1={a.x}
              y1={a.y}
              x2={b.x}
              y2={b.y}
              stroke="currentColor"
              strokeOpacity={e.dashed ? 0.3 : 0.55}
              strokeWidth={1}
              strokeDasharray={e.dashed ? '5 5' : undefined} />);


        })}
        {nodes.map((n) =>
        <g key={n.id}>
            <circle
            cx={n.x}
            cy={n.y}
            r={n.id === 'me' ? 17 : 15}
            fill={ACCENTS[n.person.accent].hex}
            stroke="currentColor"
            strokeOpacity={0.5}
            strokeWidth={n.id === 'me' ? 1.8 : 1} />
          
            <text x={n.x} y={n.y + 5} textAnchor="middle" style={{ fontSize: 14 }}>
              {n.person.emoji}
            </text>
            <text
            x={n.x}
            y={n.y + 33}
            textAnchor="middle"
            className="fill-ink"
            style={{ fontSize: 10, fontWeight: 700 }}>
            
              {n.label}
            </text>
          </g>
        )}
      </svg>
    </div>);

}