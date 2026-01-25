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
            <div className="handle-group left">
                <Handle
                    type="target"
                    position={Position.Left}
                    id={targetId}
                    isConnectable={isConnectable}
                    className={`element-handle item-handle ${isTargetConnected ? 'connected' : ''}`}
                />
            </div>
            <span className="item-text">{item}</span>
            <div className="handle-group right">
                <Handle
                    type="source"
                    position={Position.Right}
                    id={sourceId}
                    isConnectable={isConnectable}
                    className={`element-handle item-handle ${isSourceConnected ? 'connected' : ''}`}
                />
            </div>
        </li>
    );
};

export default NodeItem;
