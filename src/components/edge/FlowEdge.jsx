import React from 'react';
import { getBezierPath, EdgeLabelRenderer } from 'reactflow';

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
    data,
    hidden,
    animated
}) {
    if (hidden) return null;

    const isFlow = data?.isFlow;
    const isBackward = sourceX > targetX;

    let edgePath = '';
    let labelX = 0;
    let labelY = 0;

    if (isBackward && isFlow) {
        const diffX = sourceX - targetX;
        const midX = (sourceX + targetX) / 2;
        const midY = Math.min(sourceY, targetY) - Math.max(180, diffX * 0.6);
        edgePath = `M ${sourceX} ${sourceY} Q ${midX} ${midY} ${targetX} ${targetY}`;
        labelX = 0.25 * sourceX + 0.5 * midX + 0.25 * targetX;
        labelY = 0.25 * sourceY + 0.5 * midY + 0.25 * targetY;
    } else {
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

    // Combine classes for CSS targeting
    const edgeClasses = [
        'react-flow__edge-path',
        isFlow ? 'is-flow' : 'is-standard',
        selected ? 'is-selected' : '',
        animated ? 'is-animated' : ''
    ].join(' ');

    const { stroke, strokeWidth, ...remainingStyle } = style;

    return (
        <g className="react-flow__edge">
            {/* The actual visible line */}
            <path
                id={id}
                style={remainingStyle}
                className={edgeClasses}
                d={edgePath}
                markerEnd={markerEnd}
            />
            {/* Transparent wider path for easier clicking */}
            <path
                d={edgePath}
                fill="none"
                strokeOpacity={0}
                strokeWidth={isFlow ? 32 : 16}
                className="react-flow__edge-interaction"
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
        </g>
    );
}
