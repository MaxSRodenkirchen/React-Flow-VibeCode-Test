import { useState, useCallback } from 'react';

/**
 * useSnapping Hook
 * Manages the logic for snapping nodes to each other during drag.
 * Also manages the state of helper lines (visual guides).
 */
const useSnapping = (nodes) => {
    const [helperLineHorizontal, setHelperLineHorizontal] = useState(null);
    const [helperLineVertical, setHelperLineVertical] = useState(null);

    const onNodeDrag = useCallback(
        (event, node) => {
            const SNAP_THRESHOLD = 15;
            let horizontal = null;
            let vertical = null;

            // Extract current bounds
            const nX = node.position.x;
            const nY = node.position.y;
            const nW = node.width || 0;
            const nH = node.height || 0;
            const nCX = nX + nW / 2;
            const nCY = nY + nH / 2;

            const others = nodes.filter((n) => n.id !== node.id);

            for (const target of others) {
                const tX = target.position.x;
                const tY = target.position.y;
                const tW = target.width || 0;
                const tH = target.height || 0;
                const tCX = tX + tW / 2;
                const tCY = tY + tH / 2;

                // X-Axis Snapping
                if (Math.abs(nX - tX) < SNAP_THRESHOLD) {
                    node.position.x = tX;
                    vertical = tX;
                } else if (Math.abs((nX + nW) - (tX + tW)) < SNAP_THRESHOLD) {
                    node.position.x = tX + tW - nW;
                    vertical = tX + tW;
                } else if (Math.abs(nCX - tCX) < SNAP_THRESHOLD) {
                    node.position.x = tCX - nW / 2;
                    vertical = tCX;
                }

                // Y-Axis Snapping
                if (Math.abs(nY - tY) < SNAP_THRESHOLD) {
                    node.position.y = tY;
                    horizontal = tY;
                } else if (Math.abs((nY + nH) - (tY + tH)) < SNAP_THRESHOLD) {
                    node.position.y = tY + tH - nH;
                    horizontal = tY + tH;
                } else if (Math.abs(nCY - tCY) < SNAP_THRESHOLD) {
                    node.position.y = tCY - nH / 2;
                    horizontal = tCY;
                }
            }

            // DISTANCE SNAPPING (Equal spacing)
            if (others.length >= 2) {
                for (let i = 0; i < others.length; i++) {
                    for (let j = 0; j < others.length; j++) {
                        if (i === j) continue;
                        const nodeA = others[i];
                        const nodeB = others[j];

                        // Horizontal spacing
                        const distAB = nodeB.position.x - (nodeA.position.x + (nodeA.width || 0));
                        if (distAB > 0) {
                            const targetX = nodeB.position.x + (nodeB.width || 0) + distAB;
                            if (Math.abs(node.position.x - targetX) < SNAP_THRESHOLD) {
                                node.position.x = targetX;
                                vertical = targetX;
                            }
                        }

                        // Vertical spacing
                        const distV_AB = nodeB.position.y - (nodeA.position.y + (nodeA.height || 0));
                        if (distV_AB > 0) {
                            const targetY = nodeB.position.y + (nodeB.height || 0) + distV_AB;
                            if (Math.abs(node.position.y - targetY) < SNAP_THRESHOLD) {
                                node.position.y = targetY;
                                horizontal = targetY;
                            }
                        }
                    }
                }
            }

            setHelperLineHorizontal(horizontal);
            setHelperLineVertical(vertical);
        },
        [nodes]
    );

    const onNodeDragStop = useCallback(() => {
        setHelperLineHorizontal(null);
        setHelperLineVertical(null);
    }, []);

    return {
        helperLineHorizontal,
        helperLineVertical,
        onNodeDrag,
        onNodeDragStop,
    };
};

export default useSnapping;
