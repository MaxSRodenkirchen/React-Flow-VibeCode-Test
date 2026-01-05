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
        const isFlowSource = params.sourceHandle?.includes('flow');

        // Find source node to get its color
        const sourceNode = nodes.find(n => n.id === params.source);
        const nodeColor = sourceNode?.data?.phaseColor || '#787878';

        // Use dynamic color only if outgoing from a flow handle, otherwise use neutral
        const mainColor = getComputedStyle(document.documentElement).getPropertyValue('--main').trim() || '#787878';
        const edgeColor = isFlowSource ? nodeColor : mainColor;

        const isFlow = isFlowSource || params.targetHandle?.includes('flow');

        const edgeParams = {
            ...params,
            type: 'default',
            animated: isFlow,
            style: {
                stroke: edgeColor,
                strokeWidth: 10,
                strokeDasharray: isFlow ? '15, 15' : 'none'
            },
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
