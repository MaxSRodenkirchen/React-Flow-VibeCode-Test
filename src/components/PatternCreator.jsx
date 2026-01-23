import React, { useState, useEffect, useRef } from 'react';
import './PatternCreator.css';

const EditorListSection = ({ type, title, inputValue, onInputChange, onKeyDown, items, onMove, onRemove, onEdit }) => {
    const [editingIndex, setEditingIndex] = useState(null);
    const [editValue, setEditValue] = useState('');
    const editInputRef = useRef(null);

    const startEditing = (idx, currentValue) => {
        setEditingIndex(idx);
        setEditValue(currentValue);
    };

    const saveEdit = () => {
        if (editValue.trim() !== '') {
            onEdit(type, editingIndex, editValue.trim());
        }
        setEditingIndex(null);
    };

    const cancelEdit = () => {
        setEditingIndex(null);
    };

    const handleEditKeyDown = (e) => {
        if (e.key === 'Enter') saveEdit();
        if (e.key === 'Escape') cancelEdit();
    };

    return (
        <div className="editor-column list-column">
            <div className="column-inner">
                <div className="element-list-label-row">
                    <div className="element-list-label">{title}</div>
                </div>

                <div className="editor-input-wrapper">
                    <input
                        className="editor-inline-input"
                        value={inputValue}
                        onChange={e => onInputChange(type, e.target.value)}
                        onKeyDown={e => onKeyDown(e, type)}
                        placeholder={`+ Add ${title}...`}
                    />
                </div>

                <ul className="element-list">
                    {items.map((item, idx) => (
                        <li key={idx} className="sub-sub-element editor-list-item">
                            {editingIndex === idx ? (
                                <input
                                    ref={editInputRef}
                                    className="editor-inline-input edit-input"
                                    value={editValue}
                                    onChange={e => setEditValue(e.target.value)}
                                    onBlur={saveEdit}
                                    onKeyDown={handleEditKeyDown}
                                    autoFocus
                                />
                            ) : (
                                <span
                                    className="item-text editable"
                                    onClick={() => startEditing(idx, item)}
                                >
                                    {item}
                                </span>
                            )}
                            <div className="item-actions">
                                <button className="action-btn" onClick={() => onMove(type, idx, -1)}>↑</button>
                                <button className="action-btn" onClick={() => onMove(type, idx, 1)}>↓</button>
                                <button className="action-btn remove-btn" onClick={() => onRemove(type, idx)}>×</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

const PatternCreator = ({ onClose, onSaveSuccess, initialPattern, globalTags = [], onUnsavedChangesChange }) => {
    const [title, setTitle] = useState('');
    const [originalLabel, setOriginalLabel] = useState(''); // Track for deletion
    const titleRef = useRef(null);
    const [description, setDescription] = useState('');
    const [tagSuggestions, setTagSuggestions] = useState([]);

    const [lists, setLists] = useState({
        tags: [],
        inputs: [],
        variables: [],
        core_logic: [],
        outcomes: []
    });

    const [inputValues, setInputValues] = useState({
        tags: '',
        inputs: '',
        variables: '',
        core_logic: '',
        outcomes: ''
    });

    // Track the initial state to detect changes
    const [initialState, setInitialState] = useState(null);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    console.log('PC: Rendering, hasUnsavedChanges:', hasUnsavedChanges, 'initialState:', !!initialState);

    // Handle initialPattern for editing
    useEffect(() => {
        if (initialPattern) {
            setTitle(initialPattern.label || '');
            setOriginalLabel(initialPattern.label || '');
            const data = initialPattern.data || {};

            // Extract description and lists from elements
            const elements = data.elements || [];
            const descElement = elements.find(e => e.label === 'Description');
            setDescription(descElement?.items?.[0] || '');

            const inputsElement = elements.find(e => e.label === 'Inputs');
            const variablesElement = elements.find(e => e.label === 'Variables');
            const coreLogicElement = elements.find(e => e.label === 'Core Logic') || elements.find(e => e.label === 'Steps');
            const outcomesElement = elements.find(e => e.label === 'Outputs') || elements.find(e => e.label === 'Outcomes');

            const loadedLists = {
                tags: data.tags || [],
                inputs: inputsElement?.items || [],
                variables: variablesElement?.items || [],
                core_logic: coreLogicElement?.items || [],
                outcomes: outcomesElement?.items || []
            };

            setLists(loadedLists);

            // Store initial state for comparison
            setInitialState({
                title: initialPattern.label || '',
                description: descElement?.items?.[0] || '',
                lists: loadedLists
            });
            setHasUnsavedChanges(false);
        } else {
            // Reset if no initial pattern (new pattern mode)
            setTitle('');
            setOriginalLabel('');
            setDescription('');
            const emptyLists = {
                tags: [],
                inputs: [],
                variables: [],
                core_logic: [],
                outcomes: []
            };
            setLists(emptyLists);
            setInitialState({
                title: '',
                description: '',
                lists: emptyLists
            });
            setHasUnsavedChanges(false);
        }
    }, [initialPattern]);

    // Detect changes
    useEffect(() => {
        if (!initialState) return;

        const currentState = {
            title: title || '',
            description: description || '',
            lists: {
                tags: lists.tags || [],
                inputs: lists.inputs || [],
                variables: lists.variables || [],
                core_logic: lists.core_logic || [],
                outcomes: lists.outcomes || []
            }
        };

        const hasChanges =
            currentState.title !== initialState.title ||
            currentState.description !== initialState.description ||
            JSON.stringify(currentState.lists) !== JSON.stringify(initialState.lists);

        if (hasChanges !== hasUnsavedChanges) {
            console.log('PC: hasUnsavedChanges changed to:', hasChanges);
            setHasUnsavedChanges(hasChanges);
        }
    }, [title, description, lists, initialState, hasUnsavedChanges]);

    // Notify parent of changes
    useEffect(() => {
        if (onUnsavedChangesChange) {
            console.log('PC: Notifying App of hasUnsavedChanges:', hasUnsavedChanges);
            onUnsavedChangesChange(hasUnsavedChanges, handleSave);
        }
    }, [hasUnsavedChanges, onUnsavedChangesChange, title, description, lists]); // Include state dependencies to ensure save function is fresh

    // Auto-resize title textarea
    useEffect(() => {
        if (titleRef.current) {
            titleRef.current.style.height = 'auto';
            titleRef.current.style.height = titleRef.current.scrollHeight + 'px';
        }
    }, [title]);

    const handleInputChange = (type, value) => {
        setInputValues(prev => ({ ...prev, [type]: value }));

        // Handle tag suggestions
        if (type === 'tags') {
            console.log('Tag input changed:', value);
            console.log('Global tags available:', globalTags);
            console.log('Current tags:', lists.tags);

            if (value.trim()) {
                const filtered = globalTags.filter(t =>
                    t.toLowerCase().includes(value.toLowerCase()) &&
                    !lists.tags.includes(t)
                );
                console.log('Filtered suggestions:', filtered);
                setTagSuggestions(filtered);
            } else {
                setTagSuggestions([]);
            }
        }
    };

    const handleKeyDown = (e, type) => {
        if (e.key === 'Enter' && inputValues[type].trim() !== '') {
            e.preventDefault();
            const val = inputValues[type].trim();
            addListItem(type, val);
        }
    };

    const addListItem = (type, val) => {
        if (type === 'tags' && lists.tags.includes(val)) return;

        setLists(prev => ({
            ...prev,
            [type]: [...prev[type], val]
        }));
        setInputValues(prev => ({ ...prev, [type]: '' }));
        if (type === 'tags') setTagSuggestions([]);
    };

    const removeItem = (type, index) => {
        setLists(prev => ({
            ...prev,
            [type]: prev[type].filter((_, i) => i !== index)
        }));
    };

    const editItem = (type, index, newValue) => {
        setLists(prev => ({
            ...prev,
            [type]: prev[type].map((item, i) => i === index ? newValue : item)
        }));
    };

    const handleNew = async () => {
        if (hasUnsavedChanges) {
            const userChoice = window.confirm(
                'You have unsaved changes. Do you want to save them before creating a new pattern?\n\n' +
                'Click OK to save and continue, or Cancel to discard changes.'
            );

            if (userChoice) {
                await handleSave();
            }
        }

        setTitle('');
        setOriginalLabel('');
        setDescription('');
        const emptyLists = {
            tags: [],
            inputs: [],
            variables: [],
            core_logic: [],
            outcomes: []
        };
        setLists(emptyLists);
        setInputValues({
            tags: '',
            inputs: '',
            variables: '',
            core_logic: '',
            outcomes: ''
        });
        setTagSuggestions([]);

        setInitialState({
            title: '',
            description: '',
            lists: emptyLists
        });
        setHasUnsavedChanges(false);
    };

    const moveItem = (type, index, direction) => {
        const newList = [...lists[type]];
        const newIndex = index + direction;
        if (newIndex < 0 || newIndex >= newList.length) return;

        [newList[index], newList[newIndex]] = [newList[newIndex], newList[index]];
        setLists(prev => ({ ...prev, [type]: newList }));
    };

    const handleDelete = async () => {
        const labelToDelete = originalLabel || title;
        if (!labelToDelete) return;
        if (!window.confirm(`Are you sure you want to delete "${labelToDelete}"?`)) return;

        try {
            const HOST = window.location.hostname || '127.0.0.1';
            const response = await fetch(`http://${HOST}:3001/api/delete-pattern`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ label: labelToDelete })
            });

            if (response.ok) {
                alert('Pattern deleted.');
                handleNew();
                if (onSaveSuccess) onSaveSuccess();
            } else {
                const errData = await response.json();
                alert(`Error: ${errData.error || 'Failed to delete pattern.'}`);
            }
        } catch (error) {
            alert('Server error. Is the backend running?');
        }
    };

    const handleSave = async () => {
        if (!title) return alert('Please enter a title');

        const pattern = {
            type: "custom",
            label: title,
            data: {
                label: title,
                tags: lists.tags,
                elements: [
                    { label: "Title", type: "title", content: title },
                    { label: "Description", type: "list", items: [description] },
                    { label: "Inputs", type: "list", items: lists.inputs },
                    { label: "Variables", type: "list", items: lists.variables },
                    { label: "Core Logic", type: "list", items: lists.core_logic },
                    { label: "Outputs", type: "list", items: lists.outcomes }
                ]
            }
        };

        try {
            const HOST = window.location.hostname || '127.0.0.1';
            const response = await fetch(`http://${HOST}:3001/api/save-pattern`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(pattern)
            });

            if (response.ok) {
                const savedLists = {
                    tags: lists.tags,
                    inputs: lists.inputs,
                    variables: lists.variables,
                    core_logic: lists.core_logic,
                    outcomes: lists.outcomes
                };

                setInitialState({
                    title: title,
                    description: description,
                    lists: savedLists
                });
                setHasUnsavedChanges(false);
                setOriginalLabel(title);

                alert('Pattern saved successfully!');
                if (onSaveSuccess) onSaveSuccess();
                // We no longer call onClose() here to stay in the view
            } else {
                alert('Failed to save pattern.');
            }
        } catch (error) {
            alert('Server error. Is the backend running?');
        }
    };

    return (
        <div className="define-container">
            <div className="editor-grid">
                {/* Meta Panel: Full Width Top */}
                <div className="meta-container-row">
                    <div className="column-inner">
                        <div className="node-element element-type-title">
                            <textarea
                                ref={titleRef}
                                className="editor-title-input"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                placeholder="Pattern Title..."
                                rows={1}
                            />
                        </div>

                        <div className="meta-details">
                            <div className="node-element element-type-list element-label-description">
                                <div className="element-list-label-row">
                                    <div className="element-list-label">Description</div>
                                </div>
                                <textarea
                                    className="editor-description-textarea"
                                    value={description}
                                    onChange={e => setDescription(e.target.value)}
                                    placeholder="Brief description..."
                                />
                            </div>

                            <div className="node-element element-type-list element-label-tags">
                                <div className="element-list-label-row">
                                    <div className="element-list-label">Tags</div>
                                </div>
                                <input
                                    className="editor-inline-input"
                                    value={inputValues.tags}
                                    onChange={e => handleInputChange('tags', e.target.value)}
                                    onKeyDown={e => handleKeyDown(e, 'tags')}
                                    placeholder="+ Add Tag..."
                                />
                                {tagSuggestions.length > 0 && (
                                    <div
                                        style={{
                                            background: 'red',
                                            border: '5px solid blue',
                                            padding: '10px',
                                            marginTop: '5px',
                                            minHeight: '50px'
                                        }}
                                    >
                                        <div style={{ color: 'white', fontWeight: 'bold', marginBottom: '5px' }}>
                                            SUGGESTIONS ({tagSuggestions.length}):
                                        </div>
                                        {tagSuggestions.map((suggestion, idx) => (
                                            <div
                                                key={idx}
                                                className="suggestion-item"
                                                onClick={() => addListItem('tags', suggestion)}
                                                style={{
                                                    background: 'yellow',
                                                    padding: '10px',
                                                    margin: '5px',
                                                    cursor: 'pointer',
                                                    border: '2px solid green'
                                                }}
                                            >
                                                {suggestion}
                                            </div>
                                        ))}
                                    </div>
                                )}
                                <div className="editor-node-tags">
                                    {lists.tags.map((tag, idx) => (
                                        <div key={idx} className="tag-element">
                                            <span>{tag}</span>
                                            <button onClick={() => removeItem('tags', idx)}>×</button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content Panel: 4 Columns Row */}
                <div className="content-container-row">
                    <EditorListSection
                        type="inputs"
                        title="Inputs"
                        inputValue={inputValues.inputs}
                        onInputChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        items={lists.inputs}
                        onMove={moveItem}
                        onRemove={removeItem}
                        onEdit={editItem}
                    />

                    <EditorListSection
                        type="variables"
                        title="Variables"
                        inputValue={inputValues.variables}
                        onInputChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        items={lists.variables}
                        onMove={moveItem}
                        onRemove={removeItem}
                        onEdit={editItem}
                    />

                    <EditorListSection
                        type="core_logic"
                        title="Core Logic"
                        inputValue={inputValues.core_logic}
                        onInputChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        items={lists.core_logic}
                        onMove={moveItem}
                        onRemove={removeItem}
                        onEdit={editItem}
                    />

                    <EditorListSection
                        type="outcomes"
                        title="Outputs"
                        inputValue={inputValues.outcomes}
                        onInputChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        items={lists.outcomes}
                        onMove={moveItem}
                        onRemove={removeItem}
                        onEdit={editItem}
                    />
                </div>
            </div>

            <footer className="define-footer">
                <div className="footer-grid">
                    <button className="secondary-btn" onClick={handleNew}>New Pattern</button>
                    <button className="delete-btn" onClick={handleDelete} disabled={!title}>Delete Pattern</button>
                    <div /> {/* Spacer */}
                    <button className="primary-btn" onClick={handleSave}>Finalize & Save Pattern</button>
                </div>
            </footer>
        </div>
    );
};

export default PatternCreator;
