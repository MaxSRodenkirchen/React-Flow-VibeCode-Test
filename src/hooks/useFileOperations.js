import { useCallback } from 'react';
import { saveProject, loadProject, clearProject, saveTemplates } from '../dataService';

/**
 * useFileOperations Hook
 * Manages saving, loading, exporting, and clearing project data.
 */
const useFileOperations = (reactFlowInstance, setNodes, setEdges, setSelectedNodeId, customTemplates, setCustomTemplates) => {

    const onSave = useCallback(() => {
        if (reactFlowInstance) {
            const flow = reactFlowInstance.toObject();
            saveProject(flow);
            alert('Project saved to LocalStorage!');
        }
    }, [reactFlowInstance]);

    const onExport = useCallback(() => {
        if (reactFlowInstance) {
            const flow = reactFlowInstance.toObject();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(flow, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "flow-data.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }
    }, [reactFlowInstance]);

    const onLoad = useCallback(() => {
        const flow = loadProject();
        if (flow) {
            setNodes(flow.nodes || []);
            setEdges(flow.edges || []);
        }
    }, [setNodes, setEdges]);

    const onClear = useCallback(() => {
        if (window.confirm('Do you really want to clear the entire canvas?')) {
            setNodes([]);
            setEdges([]);
            clearProject();
            setSelectedNodeId(null);
        }
    }, [setNodes, setEdges, setSelectedNodeId]);

    const onAddTemplate = useCallback((template) => {
        const newTemplates = [...customTemplates, template];
        setCustomTemplates(newTemplates);
        saveTemplates(newTemplates);
    }, [customTemplates, setCustomTemplates]);

    return {
        onSave,
        onExport,
        onLoad,
        onClear,
        onAddTemplate,
    };
};

export default useFileOperations;
