import React, { useState } from 'react';
import { nodesLibrary as nodeTypes } from './nodesLibrary';




export default function Sidebar({ customTemplates = [], onSave, onExport, onLoad, onClear, onAddNode }) {
    const [search, setSearch] = useState('');

    const onDragStart = (event, node) => {
        event.dataTransfer.setData('application/reactflow', node.type);
        event.dataTransfer.setData('application/reactflow-label', node.label);
        event.dataTransfer.setData('application/reactflow-data', JSON.stringify(node.data));
        event.dataTransfer.effectAllowed = 'move';
    };

    const allNodes = [...nodeTypes, ...customTemplates];

    const filteredNodes = allNodes.filter(node =>
        node.label.toLowerCase().includes(search.toLowerCase()) ||
        (node.data?.phase || '').toLowerCase().includes(search.toLowerCase())
    );

    return (
        <aside className="sidebar">
            {/* Toolbar Section */}
            <div className="sidebar-toolbar">
                <button onClick={onSave} title="Save Project">Save</button>
                <button onClick={onExport} title="Export to JSON">Export</button>
                <button onClick={onLoad} title="Load Project">Load</button>
                <button onClick={onClear} className="btn-clear" title="Clear Canvas">Clear</button>
            </div>

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

