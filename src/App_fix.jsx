const handleAddStandalone = useCallback((type) => {
    const position = {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100
    };

    if (type === 'group') {
        const newNode = {
            id: getId(),
            type: 'group',
            position,
            data: { label: 'NEW GROUP' },
            style: { width: 400, height: 400 },
        };
        setNodes((nds) => nds.concat(newNode));
        return;
    }

    const newNode = {
        id: getId(),
        type: 'custom',
        position,
        data: {
            label: type === 'title' ? 'NEW TITLE' : 'NEW TEXT',
            isStandaloneTitle: type === 'title',
            isStandaloneText: type === 'text',
            elements: [{
                type: type,
                content: type === 'title' ? 'NEW TITLE' : 'NEW TEXT'
            }]
        }
    };
    setNodes((nds) => nds.concat(newNode));
}, [setNodes]);

const onNodeDragStop = useCallback((event, node) => {
    // Only check for nesting if the dragged node is NOT a group
    if (node.type === 'group') return;

    // Check if the node was dropped on top of a group node
    const intersections = nodes.filter(n =>
        n.type === 'group' &&
        n.id !== node.id &&
        node.position.x >= n.position.x &&
        node.position.y >= n.position.y &&
        node.position.x <= n.position.x + (n.style?.width || 0) &&
        node.position.y <= n.position.y + (n.style?.height || 0)
    );

    if (intersections.length > 0) {
        const parent = intersections[0];
        setNodes((nds) => nds.map((n) => {
            if (n.id === node.id) {
                return {
                    ...n,
                    parentNode: parent.id,
                    position: {
                        x: n.position.x - parent.position.x,
                        y: n.position.y - parent.position.y,
                    },
                    extent: 'parent',
                };
            }
            return n;
        }));
    }
}, [nodes, setNodes]);

// --- Global State & Shortcuts ---
const setGlobalCollapseState = useCallback((state) => {
    setGlobalCollapseMode(state);
}, []);

const toggleAllCollapse = useCallback(() => {
    setGlobalCollapseMode((prev) => {
        if (prev === 'auto') return 0;
        return (prev + 1) % 3;
    });
}, []);

const refreshTemplates = useCallback(async () => {
    const templates = await loadTemplatesFromServer();
    console.log('App: Refreshing templates and syncing canvas nodes:', templates);
    setCustomTemplates(templates);

    // Sync existing nodes on the canvas with the updated template data
    setNodes((nds) => nds.map((node) => {
        // Find the template that matches this node's label
        const template = templates.find(t => t.label === (node.data?.label || node.label));

        if (template) {
            console.log(`App: Syncing node "${node.id}" (${node.data?.label}) with new template data`);
            // Return a new node object with updated data while preserving position and id
            return {
                ...node,
                data: {
                    ...template.data,
                    label: template.label // Ensure label stays consistent
                }
            };
        }
        return node;
    }));
}, [setNodes]);

const handleUnsavedChanges = useCallback((hasChanges, saveFunc) => {
    console.log('App: handleUnsavedChanges called. hasChanges:', hasChanges);
    setHasUnsavedPatternChanges(hasChanges);
    setPatternSaveFunction(() => saveFunc);
}, []);
