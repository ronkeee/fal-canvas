import { type ConnectionLineComponentProps, getBezierPath, Position } from '@xyflow/react';

const LINE_COLOR = '#636366';

export function ConnectionLine({
  fromX,
  fromY,
  toX,
  toY,
  fromPosition,
  toPosition,
}: ConnectionLineComponentProps) {
  const [path] = getBezierPath({
    sourceX: fromX,
    sourceY: fromY,
    targetX: toX,
    targetY: toY,
    sourcePosition: fromPosition ?? Position.Right,
    targetPosition: toPosition ?? Position.Left,
  });

  return (
    <g>
      {/* Solid thin line with subtle flow animation */}
      <path
        d={path}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={1.5}
        opacity={0.6}
      />
      {/* Animated flow particles */}
      <path
        d={path}
        fill="none"
        stroke={LINE_COLOR}
        strokeWidth={1.5}
        strokeDasharray="4 4"
        opacity={0.4}
        style={{
          animation: 'dash-flow 1s linear infinite',
        }}
      />
    </g>
  );
}
