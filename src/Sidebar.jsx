import React, { useState } from 'react';

const nodeTypes = [
    {
        type: 'input',
        label: 'Logic Controller',
        elements: [
            { label: 'Title', type: 'title', content: 'Logic Controller' },
            { label: 'Description', type: 'list', items: ['Main processing unit', 'Handles all math'] },
            { label: 'Inputs', type: 'list', items: ['Data Stream A', 'Clock Signal'] },
            { label: 'Variables', type: 'list', items: ['Counter', 'State'] },
            { label: 'Steps', type: 'list', items: ['Initialize', 'Execute', 'Finalize'] },
            { label: 'Outcome', type: 'list', items: ['Result', 'Error Flag'] }
        ]
    },
    {
        type: 'default',
        label: 'Generic Step',
        elements: [
            { label: 'Title', type: 'title', content: 'Generic Step' },
            { label: 'Description', type: 'list', items: ['A simple action step'] },
            { label: 'Inputs', type: 'list', items: ['Signal'] },
            { label: 'Variables', type: 'list', items: [] },
            { label: 'Steps', type: 'list', items: ['Do action'] },
            { label: 'Outcome', type: 'list', items: ['Success'] }
        ]
    }
];




export default function Sidebar({ customTemplates = [] }) {
    const [search, setSearch] = useState('');

    const onDragStart = (event, nodeType, label, elements) => {
        event.dataTransfer.setData('application/reactflow', nodeType);
        event.dataTransfer.setData('application/reactflow-label', label);
        event.dataTransfer.setData('application/reactflow-elements', JSON.stringify(elements));
        event.dataTransfer.effectAllowed = 'move';
    };

    const allNodes = [...nodeTypes, ...customTemplates];

    const getNodeDescription = (node) => {
        const descElement = node.elements?.find(el => el.label === 'Description');
        if (descElement && descElement.items && descElement.items.length > 0) {
            return descElement.items[0];
        }
        return node.description || '';
    };

    const filteredNodes = allNodes.filter(node => {
        const desc = getNodeDescription(node);
        return node.label.toLowerCase().includes(search.toLowerCase()) ||
            desc.toLowerCase().includes(search.toLowerCase());
    });

    return (
        <aside className="sidebar">
            <div className="description">You can drag these nodes to the pane on the right.</div>
            <input
                type="text"
                placeholder="Search nodes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="search-input"
            />
            <div className="nodes-list">
                {filteredNodes.map((node, index) => {
                    const desc = getNodeDescription(node);
                    return (
                        <div
                            key={index}
                            className={`dndnode ${node.type}`}
                            onDragStart={(event) => onDragStart(event, node.type, node.label, node.elements)}
                            draggable
                        >
                            <strong>{node.label}</strong>
                            {desc && <div className="node-desc">{desc}</div>}
                        </div>
                    );
                })}

                {filteredNodes.length === 0 && <div className="no-results">No nodes found</div>}
            </div>
        </aside>
    );
}

