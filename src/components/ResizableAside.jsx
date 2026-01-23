import React, { useState, useRef, useEffect } from 'react';
import './ResizableAside.css';

const ResizableAside = ({ children, minWidth = 350, maxWidth = 500, defaultWidth = 442 }) => {
    const [width, setWidth] = useState(defaultWidth);
    const [isResizing, setIsResizing] = useState(false);
    const asideRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing) return;

            const newWidth = e.clientX;
            if (newWidth >= minWidth && newWidth <= maxWidth) {
                setWidth(newWidth);
            }
        };

        const handleMouseUp = () => {
            setIsResizing(false);
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
        };

        if (isResizing) {
            document.body.style.cursor = 'ew-resize';
            document.body.style.userSelect = 'none';
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, minWidth, maxWidth]);

    const handleMouseDown = (e) => {
        e.preventDefault();
        setIsResizing(true);
    };

    return (
        <aside
            ref={asideRef}
            className="layout-aside resizable-aside"
            style={{ width: `${width}px` }}
        >
            {children}
            <div
                className="resize-handle"
                onMouseDown={handleMouseDown}
            />
        </aside>
    );
};

export default ResizableAside;
