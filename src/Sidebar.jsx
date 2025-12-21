import React, { useState } from 'react';
import { nodesLibrary as nodeTypes } from './nodesLibrary';




export default function Sidebar({ customTemplates = [] }) {
    const [search, setSearch] = useState('');

    const onDragStart = (event, node) => {
        console.log('Drag start:', node.label, node.type);
        event.dataTransfer.setData('application/reactflow', node.type);
        event.dataTransfer.setData('application/reactflow-label', node.label);
        event.dataTransfer.setData('application/reactflow-data', JSON.stringify(node.data));
        event.dataTransfer.effectAllowed = 'move';
    };

    const allNodes = [...nodeTypes, ...customTemplates];

    const getNodeDescription = (node) => {
        // Handle both old and new data structures
        const elements = node.data?.elements || node.elements || [];
        const descElement = elements.find(el => el.label === 'Description' || el.label === 'Desc');
        if (descElement && descElement.items && descElement.items.length > 0) {
            return descElement.items[0];
        }
        return node.data?.description || node.description || '';
    };

    const filteredNodes = allNodes.filter(node => {
        const desc = getNodeDescription(node);
        return node.label.toLowerCase().includes(search.toLowerCase()) ||
            desc.toLowerCase().includes(search.toLowerCase()) ||
            (node.data?.phase || '').toLowerCase().includes(search.toLowerCase());
    });

    return (
        <aside className="sidebar">
            <div className="description">You can drag these nodes to the pane on the right.</div>
            <input
                type="text"
                placeholder="Search nodes or phases..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
            />
            <div className="nodes-list">
                {filteredNodes.map((node, index) => {
                    const desc = getNodeDescription(node);
                    const phaseColor = node.data?.phaseColor || '#eee';
                    const phase = node.data?.phase || '';

                    return (
                        <div
                            key={index}
                            className={`dndnode ${node.type}`}
                            onDragStart={(event) => onDragStart(event, node)}
                            draggable
                            style={{ borderLeft: `5px solid ${phaseColor}` }}
                        >
                            <div className="node-sidebar-header">
                                <strong>{node.label}</strong>
                                {phase && <span className="phase-badge" style={{ color: phaseColor }}>{phase}</span>}
                            </div>
                            {desc && <div className="node-desc">{desc}</div>}
                        </div>
                    );
                })}

                {filteredNodes.length === 0 && <div className="no-results">No nodes found</div>}
            </div>
        </aside>
    );
}

