import React, { memo } from 'react';
import { NodeResizer, useReactFlow } from 'reactflow';

const COLORS = [
    { name: 'Ash', value: '#b0bea9' },
    { name: 'Teal', value: '#92aa83' },
    { name: 'Frost', value: '#e0edc5' },
    { name: 'Lime', value: '#e7f59e' }
];

const ColorNode = ({ id, data, selected }) => {
    const { setNodes } = useReactFlow();
    const [isEditing, setIsEditing] = React.useState(false);
    const [editValue, setEditValue] = React.useState(data.label || 'ADD TEXT');

    const onColorSelect = (color) => {
        setNodes((nds) =>
            nds.map((node) => {
                if (node.id === id) {
                    return {
                        ...node,
                        data: { ...node.data, color }
                    };
                }
                return node;
            })
        );
    };

    const handleDoubleClick = (e) => {
        e.stopPropagation();
        setIsEditing(true);
        setEditValue(data.label || 'ADD TEXT');
    };

    const saveEdit = () => {
        setIsEditing(false);
        const finalValue = editValue.trim() || 'ADD TEXT';
        setNodes((nds) => nds.map((node) => {
            if (node.id === id) {
                return {
                    ...node,
                    data: { ...node.data, label: finalValue }
                };
            }
            return node;
        }));
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            saveEdit();
        }
        if (e.key === 'Escape') {
            setIsEditing(false);
            setEditValue(data.label || 'ADD TEXT');
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            backgroundColor: 'transparent',
            border: `64px solid ${data.color || 'var(--bg2)'}`,
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <NodeResizer
                color="var(--selection-color)"
                minWidth={50}
                minHeight={50}
                isVisible={selected}
                grid={[100, 100]}
                lineClassName="custom-resizer-line"
                handleClassName="custom-resizer-handle"
            />

            {selected && (
                <div style={{
                    position: 'absolute',
                    top: '-45px',
                    left: '0',
                    display: 'flex',
                    gap: '5px',
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    padding: '5px',
                    borderRadius: '4px',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                    zIndex: 3000
                }}>
                    {COLORS.map((c) => (
                        <button
                            key={c.value}
                            onClick={() => onColorSelect(c.value)}
                            style={{
                                width: '24px',
                                height: '24px',
                                backgroundColor: c.value,
                                border: data.color === c.value ? '2px solid #000' : '1px solid #ccc',
                                cursor: 'pointer',
                                borderRadius: '2px',
                                padding: 0
                            }}
                            title={c.name}
                        />
                    ))}
                </div>
            )}

            <div
                style={{
                    position: 'absolute',
                    top: 'var(--paddingMid)',
                    left: 'var(--paddingMid)',
                    fontSize: 'var(--font-size-large)',
                    fontFamily: '"Space Grotesk", sans-serif',
                    fontWeight: 700,
                    color: 'var(--main)',
                    zIndex: 10,
                    cursor: 'text',
                    userSelect: 'none',
                    lineHeight: 1
                }}
                onDoubleClick={handleDoubleClick}
            >
                {isEditing ? (
                    <input
                        className="node-inline-edit-input" // Use existing style
                        autoFocus
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={saveEdit}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    data.label || 'ADD TEXT'
                )}
            </div>
        </div>
    );
};

export default memo(ColorNode);
