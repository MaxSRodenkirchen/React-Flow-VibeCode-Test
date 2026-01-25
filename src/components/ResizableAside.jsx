import React, { useState, useRef, useEffect } from 'react';
import './ResizableAside.css';

const ResizableAside = ({ children, minWidth = 350, maxWidth = 500, defaultWidth = 350, isCollapsed = false }) => {
    const [width, setWidth] = useState(defaultWidth);
    const [isResizing, setIsResizing] = useState(false);
    const asideRef = useRef(null);

    useEffect(() => {
        const handleMouseMove = (e) => {
            if (!isResizing || isCollapsed) return;

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
    }, [isResizing, minWidth, maxWidth, isCollapsed]);

    const handleMouseDown = (e) => {
        if (isCollapsed) return;
        e.preventDefault();
        setIsResizing(true);
    };

    return (
        <aside
            ref={asideRef}
            className={`layout-aside resizable-aside ${isCollapsed ? 'collapsed' : ''}`}
            style={{ width: isCollapsed ? '0px' : `${width}px` }}
        >
            <div className="aside-content" style={{ opacity: isCollapsed ? 0 : 1 }}>
                {children}
            </div>
            {!isCollapsed && (
                <div
                    className="resize-handle"
                    onMouseDown={handleMouseDown}
                />
            )}
        </aside>
    );
};

export default ResizableAside;
