import { useState, useCallback } from 'react';
import { addEdge } from 'reactflow';

/**
 * useFlowConnections Hook
 * Manages connection-related logic, including dynamic colors for flow connections.
 */
const useFlowConnections = (nodes, setEdges) => {
    const [connectionLineColor, setConnectionLineColor] = useState('#787878');
    const [isFlowConnection, setIsFlowConnection] = useState(false);

    const onConnect = useCallback((params) => {
        const sourceNode = nodes.find(n => n.id === params.source);
        const targetNode = nodes.find(n => n.id === params.target);

        const checkIsTitleHandle = (node, handleId) => {
            if (!node || !handleId) return false;
            const match = handleId.match(/^(source|target)-(\d+)/);
            if (!match) return false;
            const elementIndex = parseInt(match[2]);
            return node.data?.elements?.[elementIndex]?.type === 'title';
        };

        const isTitleSource = checkIsTitleHandle(sourceNode, params.sourceHandle);
        const isTitleTarget = checkIsTitleHandle(targetNode, params.targetHandle);

        const isFlowSource = params.sourceHandle?.includes('flow') || isTitleSource;
        const isFlowTarget = params.targetHandle?.includes('flow') || isTitleTarget;

        // Find source node to get its color
        const nodeColor = sourceNode?.data?.phaseColor || '#787878';

        // Use dynamic color only if outgoing from a flow handle, otherwise use neutral
        const mainColor = getComputedStyle(document.documentElement).getPropertyValue('--main').trim() || '#787878';
        const edgeColor = isFlowSource ? nodeColor : mainColor;

        const isFlow = isFlowSource || isFlowTarget;

        const edgeParams = {
            ...params,
            type: 'custom',
            animated: isFlow,
            data: { isFlow }
        };
        setEdges((eds) => addEdge(edgeParams, eds));
    }, [nodes, setEdges]);

    const onConnectStart = useCallback((_, { nodeId, handleId }) => {
        const isFlowStart = handleId?.includes('flow');
        setIsFlowConnection(isFlowStart);

        if (isFlowStart) {
            const node = nodes.find((n) => n.id === nodeId);
            if (node) {
                setConnectionLineColor(node.data.phaseColor || '#787878');
                return;
            }
        }

        setConnectionLineColor('#787878');
    }, [nodes]);

    const onConnectEnd = useCallback(() => {
        setConnectionLineColor('#787878');
        setIsFlowConnection(false);
    }, []);

    return {
        connectionLineColor,
        isFlowConnection,
        onConnect,
        onConnectStart,
        onConnectEnd,
    };
};

export default useFlowConnections;
