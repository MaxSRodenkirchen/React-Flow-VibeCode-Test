import React from 'react';
import { Handle, Position } from 'reactflow';

/**
 * NodeTitle Component
 * Displays the header of a node with flow-handles for logical connections
 * and standard handles for general connections.
 */
const NodeTitle = ({ content, label, index, isConnectable, connectedHandleIds }) => {
    return (
        <div className="element-title-row">
            {/* Flow Handle (Left) - Used for animated dashed connections */}
            <Handle
                type="target"
                position={Position.Left}
                id="flow-target"
                isConnectable={isConnectable}
                className={`element-handle flow-handle ${connectedHandleIds.includes('flow-target') ? 'connected' : ''}`}
            />

            {/* Title Text */}
            <div className="item-text element-label">{content || label || 'Untitled'}</div>

            {/* Flow Handle (Right) - Used for animated dashed connections */}
            <Handle
                type="source"
                position={Position.Right}
                id="flow-source"
                isConnectable={isConnectable}
                className={`element-handle flow-handle ${connectedHandleIds.includes('flow-source') ? 'connected' : ''}`}
            />

            {/* Standard handles for standard connections (Compatibility) */}
            <Handle
                type="target"
                position={Position.Left}
                id={`target-${index}`}
                isConnectable={isConnectable}
                className="title-standard-handle"
            />
            <Handle
                type="source"
                position={Position.Right}
                id={`source-${index}`}
                isConnectable={isConnectable}
                className="title-standard-handle"
            />
        </div>
    );
};

export default NodeTitle;
