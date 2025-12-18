import React from 'react';

const ListInput = ({ label, items, onChange }) => {
    const addItem = () => onChange([...items, ""]);
    const removeItem = (index) => onChange(items.filter((_, i) => i !== index));
    const updateItem = (index, value) => {
        const newItems = [...items];
        newItems[index] = value;
        onChange(newItems);
    };

    return (
        <div className="list-config-group">
            <label>{label}:</label>
            {items.map((item, index) => (
                <div key={index} className="element-input-row">
                    <input
                        type="text"
                        value={item}
                        onChange={(e) => updateItem(index, e.target.value)}
                        placeholder={`Add to ${label}...`}
                    />
                    <button type="button" onClick={() => removeItem(index)} className="btn-remove">×</button>
                </div>
            ))}
            <button type="button" onClick={addItem} className="btn-add">Add to {label}</button>
        </div>
    );
};

export default function NodeEditor({ selectedNode, onUpdateNode }) {
    if (!selectedNode) {
        return <div className="node-editor-empty">Select a node on the canvas to edit</div>;
    }

    const { data } = selectedNode;
    const elements = data.elements || [];

    const updateTitle = (val) => {
        const newElements = elements.map(el => el.type === 'title' ? { ...el, content: val } : el);
        onUpdateNode(selectedNode.id, { label: val, elements: newElements });
    };

    const updateList = (label, newItems) => {
        const newElements = elements.map(el => el.label === label ? { ...el, items: newItems } : el);
        onUpdateNode(selectedNode.id, { elements: newElements });
    };

    const getItems = (label) => {
        const el = elements.find(e => e.label === label);
        return el ? el.items : [];
    };

    const getTitle = () => {
        const el = elements.find(e => e.type === 'title');
        return el ? el.content : data.label;
    };

    return (
        <div className="node-creator node-editor">
            <h3>Edit Node: {getTitle()}</h3>
            <div className="form-group">
                <label>Title:</label>
                <input
                    type="text"
                    value={getTitle()}
                    onChange={(e) => updateTitle(e.target.value)}
                    placeholder="Node Title"
                />
            </div>

            <ListInput label="Description" items={getItems('Description')} onChange={(items) => updateList('Description', items)} />
            <ListInput label="Inputs" items={getItems('Inputs')} onChange={(items) => updateList('Inputs', items)} />
            <ListInput label="Variables" items={getItems('Variables')} onChange={(items) => updateList('Variables', items)} />
            <ListInput label="Steps" items={getItems('Steps')} onChange={(items) => updateList('Steps', items)} />
            <ListInput label="Outcome" items={getItems('Outcome')} onChange={(items) => updateList('Outcome', items)} />

            <p style={{ fontSize: '10px', color: '#888', marginTop: '10px' }}>Changes are saved automatically to the canvas.</p>
        </div>
    );
}
