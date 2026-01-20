import { useCallback } from 'react';

const SNAP_DISTANCE = 20;

const useEdgeSnapping = (nodes, setNodes) => {
    const onNodeDrag = useCallback((event, node) => {
        let snappedX = node.position.x;
        let snappedY = node.position.y;

        const otherNodes = nodes.filter((n) => n.id !== node.id);

        for (const other of otherNodes) {
            // Snap Left Edge to Other's Left Edge
            if (Math.abs(node.position.x - other.position.x) < SNAP_DISTANCE) {
                snappedX = other.position.x;
            }
            // Snap Top Edge to Other's Top Edge
            if (Math.abs(node.position.y - other.position.y) < SNAP_DISTANCE) {
                snappedY = other.position.y;
            }

            // Snap to bottom of other node with a fixed gap (e.g. 100)
            const gap = 100;
            if (other.height && Math.abs(node.position.y - (other.position.y + other.height + gap)) < SNAP_DISTANCE) {
                snappedY = other.position.y + other.height + gap;
            }
        }

        // Apply snapping
        if (snappedX !== node.position.x || snappedY !== node.position.y) {
            setNodes((nds) =>
                nds.map((n) =>
                    n.id === node.id
                        ? { ...n, position: { x: snappedX, y: snappedY } }
                        : n
                )
            );
        }
    }, [nodes, setNodes]);

    return { onNodeDrag };
};

export default useEdgeSnapping;
