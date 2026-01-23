import React, { useState } from 'react';
import { Handle, Position, useReactFlow } from 'reactflow';

/**
 * NodeTitle Component
 * Displays the header of a node with flow-handles for logical connections
 * and standard handles for general connections.
 */
const NodeTitle = ({ id, content, label, index, isConnectable, connectedHandleIds, isStandaloneTitle, isStandaloneText, selected }) => {
    const { setNodes } = useReactFlow();
    const [isEditing, setIsEditing] = useState(false);
    const [editValue, setEditValue] = useState(content || label || '');

    const isAnyStandalone = isStandaloneTitle || isStandaloneText;

    const handleDoubleClick = (e) => {
        if (!isAnyStandalone) return;
        e.stopPropagation();
        setIsEditing(true);
        setEditValue(content || label || '');
    };

    const handleBlur = () => {
        saveEdit();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            saveEdit();
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
            setEditValue(content || label || '');
        }
    };

    const saveEdit = () => {
        if (!isEditing) return;
        setIsEditing(false);

        const finalValue = editValue.trim();
        if (finalValue === '') return;

        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return {
                    ...node,
                    data: {
                        ...node.data,
                        label: finalValue,
                        elements: (node.data.elements || []).map((el, idx) =>
                            idx === index ? { ...el, content: finalValue } : el
                        )
                    }
                };
            }
            return node;
        }));
    };

    return (
        <div
            className={`element-title-row ${isStandaloneTitle ? 'standalone-title-block' : ''} ${isStandaloneText ? 'standalone-text-block' : ''}`}
            onDoubleClick={handleDoubleClick}
        >
            {/* Target/Input Handles (Left) */}
            <div className="handle-group left">
                {!isAnyStandalone && (
                    <Handle
                        type="target"
                        position={Position.Left}
                        id="flow-target"
                        isConnectable={isConnectable}
                        className={`element-handle flow-handle ${connectedHandleIds.includes('flow-target') ? 'connected' : ''}`}
                    />
                )}
                <Handle
                    type="target"
                    position={Position.Left}
                    id={`target-${index}`}
                    isConnectable={isConnectable}
                    className={`element-handle title-standard-handle ${isAnyStandalone ? 'visible-handle' : ''} ${connectedHandleIds.includes(`target-${index}`) ? 'connected' : ''}`}
                />
            </div>

            {/* Content */}
            <div className={`item-text ${isStandaloneText ? 'standalone-label' : 'element-label'}`}>
                {isEditing ? (
                    <input
                        className="node-inline-edit-input"
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    content || label || 'Untitled'
                )}
            </div>

            {/* Source/Output Handles (Right) */}
            <div className="handle-group right">
                {!isAnyStandalone && (
                    <Handle
                        type="source"
                        position={Position.Right}
                        id="flow-source"
                        isConnectable={isConnectable}
                        className={`element-handle flow-handle ${connectedHandleIds.includes('flow-source') ? 'connected' : ''}`}
                    />
                )}
                <Handle
                    type="source"
                    position={Position.Right}
                    id={`source-${index}`}
                    isConnectable={isConnectable}
                    className={`element-handle title-standard-handle ${isAnyStandalone ? 'visible-handle' : ''} ${connectedHandleIds.includes(`source-${index}`) ? 'connected' : ''}`}
                />
            </div>
        </div>
    );
};

export default NodeTitle;
