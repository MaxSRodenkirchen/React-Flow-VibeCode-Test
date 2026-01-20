import React from 'react';
import NodeItem from './NodeItem';

/**
 * NodeListElement Component
 * Represents a list section within a node (e.g., "Inputs", "Outputs").
 */
const NodeListElement = ({ element, index, isCollapsed, isConnectable, connectedHandleIds }) => {
    return (
        <>
            {/* Label for the list section */}
            <div className="element-list-label-row">
                <div className="placeholder-handle"></div>
                <div className="item-text element-list-label">{element.label}</div>
                <div className="placeholder-handle"></div>
            </div>

            {/* List of items */}
            <ul className="element-list">
                {(element.items || []).map((item, itemIndex) => {
                    const itemId = `target-${index}-${itemIndex}`;
                    const sourceId = `source-${index}-${itemIndex}`;
                    const isItemConnected = connectedHandleIds.includes(itemId) || connectedHandleIds.includes(sourceId);

                    // If node is collapsed, only show items that have active connections
                    if (isCollapsed && !isItemConnected) return null;

                    return (
                        <NodeItem
                            key={itemIndex}
                            item={item}
                            index={itemIndex}
                            elementIndex={index}
                            isConnectable={isConnectable}
                            connectedHandleIds={connectedHandleIds}
                        />
                    );
                })}
            </ul>
        </>
    );
};

export default NodeListElement;
