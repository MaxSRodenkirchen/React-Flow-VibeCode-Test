import React from 'react';
import { getBezierPath, BaseEdge, Position, EdgeLabelRenderer } from 'reactflow';

export default function FlowEdge({
    id,
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    style = {},
    markerEnd,
    selected,
    label,
    labelStyle,
    data
}) {
    // Determine if it's a flow edge (logic) or standard edge (data/text)
    const isFlow = data?.isFlow;
    // Determine if it's a backward connection (Loop)
    const isBackward = sourceX > targetX;

    let edgePath = '';
    let labelX = 0;
    let labelY = 0;

    // Only use the huge arc for Logic Flow edges
    if (isBackward && isFlow) {
        // Create a custom arc path for backwards loops
        const diffX = sourceX - targetX;
        const midX = (sourceX + targetX) / 2;
        // Significantly increased arc: at least 180px up, scales more with distance (0.6x)
        const midY = Math.min(sourceY, targetY) - Math.max(180, diffX * 0.6);

        edgePath = `M ${sourceX} ${sourceY} Q ${midX} ${midY} ${targetX} ${targetY}`;

        // For Quadratic Bezier (Q), the midpoint of the curve is at:
        labelX = 0.25 * sourceX + 0.5 * midX + 0.25 * targetX;
        labelY = 0.25 * sourceY + 0.5 * midY + 0.25 * targetY;
    } else {
        // Standard Bezier for forward flow or non-logic backward flow
        const [path, lx, ly] = getBezierPath({
            sourceX,
            sourceY,
            sourcePosition,
            targetX,
            targetY,
            targetPosition,
        });
        edgePath = path;
        labelX = lx;
        labelY = ly;
    }

    return (
        <>
            <BaseEdge
                path={edgePath}
                markerEnd={markerEnd}
                style={{
                    ...style,
                    strokeWidth: selected ? 24 : 20,
                    stroke: isFlow ? '#000' : '#888',
                    opacity: selected ? 1 : 0.5,
                    transition: 'opacity 0.2s, stroke 0.2s, stroke-width 0.2s',
                    fill: 'none',
                }}
            />
            {label && (
                <EdgeLabelRenderer>
                    <div
                        style={{
                            position: 'absolute',
                            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
                            background: '#000',
                            color: '#fff',
                            padding: '4px 8px',
                            borderRadius: '4px',
                            fontSize: '12px',
                            fontWeight: 700,
                            pointerEvents: 'all',
                            ...labelStyle
                        }}
                        className="nodrag nopan"
                    >
                        {label}
                    </div>
                </EdgeLabelRenderer>
            )}
        </>
    );
}
