import React from 'react';
import { Handle, Position } from 'reactflow';

/**
 * NodeItem Component
 * Represents a single item within a list in a node.
 * Includes handles for input (target) and output (source).
 */
const NodeItem = ({ item, index, elementIndex, isConnectable, connectedHandleIds }) => {
    const targetId = `target-${elementIndex}-${index}`;
    const sourceId = `source-${elementIndex}-${index}`;

    const isTargetConnected = connectedHandleIds.includes(targetId);
    const isSourceConnected = connectedHandleIds.includes(sourceId);

    return (
        <li className="sub-sub-element">
            <Handle
                type="target"
                position={Position.Left}
                id={targetId}
                isConnectable={isConnectable}
                className={`element-handle item-handle ${isTargetConnected ? 'connected' : ''}`}
            />
            <span className="item-text">{item}</span>
            <Handle
                type="source"
                position={Position.Right}
                id={sourceId}
                isConnectable={isConnectable}
                className={`element-handle item-handle ${isSourceConnected ? 'connected' : ''}`}
            />
        </li>
    );
};

export default NodeItem;
