import React, { useState } from 'react';

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

export default function NodeCreator({ onAddTemplate }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState(['']);
    const [inputs, setInputs] = useState(['']);
    const [variables, setVariables] = useState(['']);
    const [steps, setSteps] = useState(['']);
    const [outcome, setOutcome] = useState(['']);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        const newTemplate = {
            type: 'default',
            label: title,
            elements: [
                { label: 'Title', type: 'title', content: title },
                { label: 'Description', type: 'list', items: description.filter(i => i.trim() !== '') },
                { label: 'Inputs', type: 'list', items: inputs.filter(i => i.trim() !== '') },
                { label: 'Variables', type: 'list', items: variables.filter(i => i.trim() !== '') },
                { label: 'Steps', type: 'list', items: steps.filter(i => i.trim() !== '') },
                { label: 'Outcome', type: 'list', items: outcome.filter(i => i.trim() !== '') }
            ]
        };


        onAddTemplate(newTemplate);
        setTitle('');
        setDescription(['']);
        setInputs(['']);
        setVariables(['']);
        setSteps(['']);
        setOutcome(['']);
    };

    return (
        <div className="node-creator">
            <h3>Structure Node Builder</h3>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Title:</label>
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Node Title"
                    />
                </div>

                <ListInput label="Description" items={description} onChange={setDescription} />
                <ListInput label="Inputs" items={inputs} onChange={setInputs} />
                <ListInput label="Variables" items={variables} onChange={setVariables} />
                <ListInput label="Steps" items={steps} onChange={setSteps} />
                <ListInput label="Outcome" items={outcome} onChange={setOutcome} />

                <button type="submit" className="btn-save-template">Save to Sidebar</button>
            </form>
        </div>
    );
}
