import { useCallback } from 'react';
import { saveProjectToServer, loadProjectFromServer } from '../dataService';

/**
 * useFileOperations Hook
 * Manages saving, loading, exporting, and clearing project data via local server.
 */
const useFileOperations = (reactFlowInstance, setNodes, setEdges, setSelectedNodeId) => {

    const onSave = useCallback(async () => {
        if (reactFlowInstance) {
            const flow = reactFlowInstance.toObject();
            const success = await saveProjectToServer(flow);
            if (success) {
                alert('Project saved to project_state.json!');
            } else {
                alert('Error: Could not save to disk.');
            }
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

    const onLoad = useCallback(async () => {
        const flow = await loadProjectFromServer();
        if (flow) {
            setNodes(flow.nodes || []);
            setEdges(flow.edges || []);
        } else {
            alert('No project file found on server.');
        }
    }, [setNodes, setEdges]);

    const onClear = useCallback(async () => {
        if (window.confirm('Do you really want to clear the entire canvas and reset the save file?')) {
            setNodes([]);
            setEdges([]);
            await saveProjectToServer({ nodes: [], edges: [] });
            setSelectedNodeId(null);
        }
    }, [setNodes, setEdges, setSelectedNodeId]);

    return {
        onSave,
        onExport,
        onLoad,
        onClear
    };
};

export default useFileOperations;
