import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

export default memo(({ data, isConnectable }) => {
    // We check for global collapse state from some external source if needed, 
    // but React Flow nodes usually rely on data. 
    // Assuming 'nodes-collapsed' class on the wrapper is the global toggle.
    const isCollapsed = data.collapsed;
    const connectedHandleIds = data.connectedHandleIds || [];
    const phaseColor = data.phaseColor || '#000';

    return (
        <div
            /* 
               'custom-node-stacked' is the main CSS class in App.css.
               'node-is-collapsed' is added when the node is in collapsed mode.
            */
            className={`custom-node-stacked ${isCollapsed ? 'node-is-collapsed' : ''}`}
            style={{
                borderColor: phaseColor,
                '--node-color': phaseColor
            }}
        >
            {(data.elements || []).map((element, index) => {
                // Smart Collapse Logic:
                // If collapsed, only show if:
                // 1. It's the title
                // 2. The element's own handles are connected
                // 3. Any of its sub-items are connected
                const isTitle = element.type === 'title';
                const hasConnectedHandles = connectedHandleIds.some(h => h.startsWith(`target-${index}`) || h.startsWith(`source-${index}`));
                const connectedSubItems = (element.items || []).filter((_, itemIndex) =>
                    connectedHandleIds.includes(`target-${index}-${itemIndex}`) ||
                    connectedHandleIds.includes(`source-${index}-${itemIndex}`)
                );
                const hasConnectedSubItems = connectedSubItems.length > 0;
                const isFlowConnected = isTitle && connectedHandleIds.some(h => h.includes('flow'));

                const shouldShowElement = !isCollapsed || isTitle || hasConnectedHandles || hasConnectedSubItems;

                if (!shouldShowElement) return null;

                return (
                    <div
                        key={index}
                        /* 
                           Dynamic classes allow us to target specific elements:
                           - element-type-title
                           - element-type-default
                           - etc.
                        */
                        /* The title now uses the same transparent background as other elements */
                        className={`node-element element-type-${element.type || 'default'} element-label-${(element.label || '').toLowerCase()}`}
                    >
                        <div className="element-content">
                            {isTitle ? (
                                <div className="element-title-row">
                                    <Handle
                                        type="target"
                                        position={Position.Left}
                                        id="flow-target"
                                        isConnectable={isConnectable}
                                        className={`element-handle flow-handle ${connectedHandleIds.includes('flow-target') ? 'connected' : ''}`}
                                    />
                                    <div className="item-text element-label">{element.content || data.label || 'Untitled'}</div>
                                    <Handle
                                        type="source"
                                        position={Position.Right}
                                        id="flow-source"
                                        isConnectable={isConnectable}
                                        className={`element-handle flow-handle ${connectedHandleIds.includes('flow-source') ? 'connected' : ''}`}
                                    />
                                    {/* Logical standard handles for connection compatibility */}
                                    <Handle type="target" position={Position.Left} id={`target-${index}`} isConnectable={isConnectable} className="title-standard-handle" />
                                    <Handle type="source" position={Position.Right} id={`source-${index}`} isConnectable={isConnectable} className="title-standard-handle" />
                                </div>
                            ) : (
                                <>
                                    <div className="element-list-label-row">
                                        <div className="element-handle placeholder-handle"></div>
                                        <div className="item-text element-list-label">{element.label}</div>
                                        <div className="element-handle placeholder-handle"></div>
                                    </div>
                                    <ul className="element-list">
                                        {(element.items || []).map((item, itemIndex) => {
                                            const isItemConnected = connectedHandleIds.includes(`target-${index}-${itemIndex}`) ||
                                                connectedHandleIds.includes(`source-${index}-${itemIndex}`);

                                            // If collapsed, hide unconnected items
                                            if (isCollapsed && !isItemConnected) return null;

                                            return (
                                                <li key={itemIndex} className="sub-sub-element">
                                                    <Handle
                                                        type="target"
                                                        position={Position.Left}
                                                        id={`target-${index}-${itemIndex}`}
                                                        isConnectable={isConnectable}
                                                        className={`element-handle item-handle ${connectedHandleIds.includes(`target-${index}-${itemIndex}`) ? 'connected' : ''}`}
                                                    />
                                                    <span className="item-text">{item}</span>
                                                    <Handle
                                                        type="source"
                                                        position={Position.Right}
                                                        id={`source-${index}-${itemIndex}`}
                                                        isConnectable={isConnectable}
                                                        className={`element-handle item-handle ${connectedHandleIds.includes(`source-${index}-${itemIndex}`) ? 'connected' : ''}`}
                                                    />
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </>
                            )}
                        </div>
                    </div>
                );
            })}
            {/* Visual indicator shown only when the node is collapsed */}
            {isCollapsed && (
                <div className="collapse-stack-indicator">
                    <div className="stack-layer stack-layer-1" style={{ backgroundColor: phaseColor }} />
                    <div className="stack-layer stack-layer-2" style={{ backgroundColor: phaseColor }} />
                    <span className="expand-text">expand for more</span>
                </div>
            )}
        </div>
    );
});
