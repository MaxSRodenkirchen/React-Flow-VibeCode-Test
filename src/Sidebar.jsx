import React, { useState } from 'react';

export default function Sidebar({ templates = [], onAddNode }) {
    const [search, setSearch] = useState('');

    const onDragStart = (event, node) => {
        event.dataTransfer.setData('application/reactflow', node.type);
        event.dataTransfer.setData('application/reactflow-label', node.label);
        event.dataTransfer.setData('application/reactflow-data', JSON.stringify(node.data));
        event.dataTransfer.effectAllowed = 'move';
    };

    const allNodes = templates;

    const filteredNodes = allNodes.filter(node =>
        node.label.toLowerCase().includes(search.toLowerCase()) ||
        (node.data?.tags || []).some(tag => tag.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <aside className="sidebar">
            <input
                type="text"
                placeholder="Search nodes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
            />

            <div className="nodes-list">
                {filteredNodes.map((node, index) => (
                    <div
                        key={index}
                        className={`dndnode ${node.type}`}
                        onDragStart={(event) => onDragStart(event, node)}
                        onMouseUp={() => onAddNode(node)}
                        draggable
                    >
                        <strong>{node.label}</strong>
                    </div>
                ))}
            </div>
        </aside>
    );
}
