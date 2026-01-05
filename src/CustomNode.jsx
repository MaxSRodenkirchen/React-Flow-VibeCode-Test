import React, { memo } from 'react';
import NodeTitle from './components/node/NodeTitle';
import NodeListElement from './components/node/NodeListElement';

/**
 * CustomNode Component
 * The main node component used in the React Flow canvas.
 * Orchestrates its sub-components and handles the collapse/expand state.
 */
const CustomNode = ({ data, isConnectable }) => {
    const isCollapsed = !!data.collapsed;
    const connectedHandleIds = data.connectedHandleIds || [];
    const phaseColor = data.phaseColor || '#000';
    const elements = data.elements || [];

    return (
        <div
            className={`custom-node-stacked ${isCollapsed ? 'node-is-collapsed' : ''}`}
            style={{
                borderColor: phaseColor,
                '--node-color': phaseColor
            }}
        >
            {elements.map((element, index) => {
                const isTitle = element.type === 'title';

                // --- Smart Collapse Logic ---
                // We decide if this specific element (segment of the node) should be visible.
                const hasConnectedHandles = connectedHandleIds.some(
                    h => h.startsWith(`target-${index}`) || h.startsWith(`source-${index}`)
                );
                const hasConnectedSubItems = (element.items || []).some((_, itemIndex) =>
                    connectedHandleIds.includes(`target-${index}-${itemIndex}`) ||
                    connectedHandleIds.includes(`source-${index}-${itemIndex}`)
                );

                // Logic: Show if it's NOT collapsed, OR if it's the title, OR it has active connections.
                const shouldShowElement = !isCollapsed || isTitle || hasConnectedHandles || hasConnectedSubItems;

                if (!shouldShowElement) return null;

                return (
                    <div
                        key={index}
                        className={`node-element element-type-${element.type || 'default'} element-label-${(element.label || '').toLowerCase()}`}
                    >
                        <div className="element-content">
                            {isTitle ? (
                                <NodeTitle
                                    content={element.content}
                                    label={data.label}
                                    index={index}
                                    isConnectable={isConnectable}
                                    connectedHandleIds={connectedHandleIds}
                                />
                            ) : (
                                <NodeListElement
                                    element={element}
                                    index={index}
                                    isCollapsed={isCollapsed}
                                    isConnectable={isConnectable}
                                    connectedHandleIds={connectedHandleIds}
                                />
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Stack indicator shown when collapsed to hint at hidden content */}
            {isCollapsed && (
                <div className="collapse-stack-indicator">
                    <div className="stack-layer stack-layer-1" style={{ backgroundColor: phaseColor }} />
                    <div className="stack-layer stack-layer-2" style={{ backgroundColor: phaseColor }} />
                    <span className="expand-text">expand for more</span>
                </div>
            )}
        </div>
    );
};

export default memo(CustomNode);
