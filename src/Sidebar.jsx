import React, { useState } from 'react';

export default function Sidebar({ templates = [], onAddNode, allTags = [] }) {
    const [search, setSearch] = useState('');
    const [selectedTag, setSelectedTag] = useState(null);

    const onDragStart = (event, node) => {
        event.dataTransfer.setData('application/reactflow', node.type);
        event.dataTransfer.setData('application/reactflow-label', node.label);
        event.dataTransfer.setData('application/reactflow-data', JSON.stringify(node.data));
        event.dataTransfer.effectAllowed = 'move';
    };

    const filteredNodes = templates.filter(node => {
        const matchesSearch = node.label.toLowerCase().includes(search.toLowerCase()) ||
            (node.data?.tags || []).some(tag => tag.toLowerCase().includes(search.toLowerCase()));

        const matchesTag = !selectedTag || (node.data?.tags || []).includes(selectedTag);

        return matchesSearch && matchesTag;
    });

    return (
        <aside className="sidebar">
            <div className="sidebar-search-section">
                <input
                    type="text"
                    placeholder="Search nodes..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="search-input"
                />
            </div>

            {allTags.length > 0 && (
                <div className="sidebar-tags">
                    <button
                        className={`sidebar-tag-btn ${!selectedTag ? 'active' : ''}`}
                        onClick={() => setSelectedTag(null)}
                    >
                        All
                    </button>
                    {allTags.map(tag => (
                        <button
                            key={tag}
                            className={`sidebar-tag-btn ${selectedTag === tag ? 'active' : ''}`}
                            onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                        >
                            {tag}
                        </button>
                    ))}
                </div>
            )}

            <div className="nodes-list">
                {filteredNodes.length > 0 ? (
                    filteredNodes.map((node, index) => (
                        <div
                            key={index}
                            className={`dndnode ${node.type}`}
                            onDragStart={(event) => onDragStart(event, node)}
                            onMouseUp={() => onAddNode(node)}
                            draggable
                        >
                            <div className="dndnode-content">
                                <strong>{node.label}</strong>
                                {node.data?.tags && node.data.tags.length > 0 && (
                                    <div className="dndnode-tags-preview">
                                        {node.data.tags.map(t => <span key={t}>#{t}</span>)}
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="empty-search">No modules found</div>
                )}
            </div>
        </aside>
    );
}
