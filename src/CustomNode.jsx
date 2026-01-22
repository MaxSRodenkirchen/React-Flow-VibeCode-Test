import React, { memo } from 'react';
import { useStore } from 'reactflow';
import NodeTitle from './components/node/NodeTitle';
import NodeListElement from './components/node/NodeListElement';

const zoomSelector = (s) => s.transform[2] || 1;

const CustomNode = ({ data, isConnectable, selected }) => {
    const zoom = useStore(zoomSelector);

    // 1. Determine Individual Override (from Double Click)
    const localOverride = data.collapseState;

    // 2. Determine Global Mode (from Toolbar/Auto)
    const globalMode = data.globalCollapseMode !== undefined ? data.globalCollapseMode : 'auto';

    // 3. Calculate Zoom-based LOD
    let zoomLOD = 0;
    if (zoom <= 0.5) zoomLOD = 2; // Compact / Titles
    else if (zoom <= 0.8) zoomLOD = 1; // Balanced / Connected

    // 4. Resolve Final State
    let collapseState = 0;
    if (localOverride !== undefined) {
        collapseState = localOverride;
    } else if (globalMode !== 'auto') {
        collapseState = globalMode;
    } else {
        collapseState = zoomLOD;
    }

    const connectedHandleIds = data.connectedHandleIds || [];
    const elements = data.elements || [];

    return (
        <div
            className={`custom-node-stacked collapse-state-${collapseState} ${selected ? 'node-selected' : ''}`}
        >
            {elements.map((element, index) => {
                const isTitle = element.type === 'title';

                // --- Smart Collapse Logic ---
                const hasConnectedHandles = connectedHandleIds.some(
                    h => h.startsWith(`target-${index}`) || h.startsWith(`source-${index}`)
                );
                const hasConnectedSubItems = (element.items || []).some((_, itemIndex) =>
                    connectedHandleIds.includes(`target-${index}-${itemIndex}`) ||
                    connectedHandleIds.includes(`source-${index}-${itemIndex}`)
                );

                let shouldShowElement = true;
                if (collapseState === 1) {
                    shouldShowElement = isTitle || hasConnectedHandles || hasConnectedSubItems;
                } else if (collapseState === 2) {
                    shouldShowElement = isTitle;
                }

                return (
                    <div
                        key={index}
                        className={`node-element element-type-${element.type || 'default'} element-label-${(element.label || '').toLowerCase()} ${!shouldShowElement ? 'element-hidden' : ''}`}
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
                                    isCollapsed={collapseState === 1}
                                    isConnectable={isConnectable}
                                    connectedHandleIds={connectedHandleIds}
                                />
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default memo(CustomNode);
