import React from 'react';
import { Person } from '../../../packages/shared';
import { ACCENTS, cn } from '../../../packages/ui';

type Node = {
  id: string;
  label: string;
  x: number;
  y: number;
  accent: Person['accent'];
  self?: boolean;
};

type Edge = {from: string;to: string;dashed?: boolean;};

type FriendNetworkGraphProps = {
  nodes: Node[];
  edges: Edge[];
  selectedId?: string;
  onSelect?: (id: string) => void;
};

/** Clean, neoclassical node/edge map — thin lines, tidy nodes, on a crisp card. */
export function FriendNetworkGraph({
  nodes,
  edges,
  selectedId,
  onSelect
}: FriendNetworkGraphProps) {
  const byId = React.useMemo(
    () => Object.fromEntries(nodes.map((n) => [n.id, n])),
    [nodes]
  );

  return (
    <div className="rounded-card border border-ink-line bg-canvas-raised p-3 text-ink">
      <svg viewBox="0 0 300 200" className="h-[200px] w-full" role="img" aria-label="Friend network">
        <g>
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
                strokeOpacity={e.dashed ? 0.25 : 0.45}
                strokeWidth={1}
                strokeDasharray={e.dashed ? '4 4' : undefined} />);


          })}
        </g>
        <g>
          {nodes.map((n) => {
            const active = n.id === selectedId;
            return (
              <g
                key={n.id}
                onClick={() => onSelect?.(n.id)}
                className="cursor-pointer"
                role="button"
                aria-label={n.label}>
                
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={n.self ? 15 : 11}
                  fill={ACCENTS[n.accent].hex}
                  stroke="currentColor"
                  strokeOpacity={0.5}
                  strokeWidth={active || n.self ? 1.6 : 0.8} />
                
                <text
                  x={n.x}
                  y={n.y + (n.self ? 30 : 25)}
                  textAnchor="middle"
                  className={cn('fill-ink text-[9px]', active ? 'font-bold' : 'font-medium')}
                  style={{ fontSize: 9 }}>
                  
                  {n.label}
                </text>
              </g>);

          })}
        </g>
      </svg>
    </div>);

}