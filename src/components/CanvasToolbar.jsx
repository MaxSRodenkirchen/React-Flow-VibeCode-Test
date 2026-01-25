import React, { useState, useEffect } from 'react';
import './CanvasToolbar.css';

const CanvasToolbar = ({
    collapseMode,
    onCollapseModeChange,
    onAddStandalone
}) => {
    const [feedback, setFeedback] = useState('');

    useEffect(() => {
        if (feedback) {
            const timer = setTimeout(() => setFeedback(''), 2000);
            return () => clearTimeout(timer);
        }
    }, [feedback]);

    const handleModeChange = (mode, label) => {
        onCollapseModeChange(mode);
        setFeedback(`View set to ${label}`);
    };

    const handleCreate = (type, label) => {
        onAddStandalone(type);
        setFeedback(`${label} module added`);
    };

    return (
        <div className="canvas-toolbar">
            {feedback && <div className="toolbar-feedback">{feedback}</div>}
            <div className="toolbar-inner">
                {/* Left Side: View Modes */}
                <div className="toolbar-group">
                    <button
                        className={`toolbar-btn ${collapseMode === 'auto' ? 'active' : ''}`}
                        onClick={() => handleModeChange('auto', 'Auto Zoom')}
                        title="Auto Zoom"
                    >
                        <div className="icon-rects auto-zoom">
                            <span className="op-high"></span>
                            <span className="op-mid"></span>
                            <span className="op-low"></span>
                        </div>
                    </button>

                    <button
                        className={`toolbar-btn ${collapseMode === 0 ? 'active' : ''}`}
                        onClick={() => handleModeChange(0, 'Expanded')}
                        title="Expanded View"
                    >
                        <div className="icon-rects expanded">
                            <span></span>
                            <span></span>
                            <span></span>
                        </div>
                    </button>

                    <button
                        className={`toolbar-btn ${collapseMode === 1 ? 'active' : ''}`}
                        onClick={() => handleModeChange(1, 'Balanced')}
                        title="Balanced View"
                    >
                        <div className="icon-rects balanced">
                            <span></span>
                            <span></span>
                        </div>
                    </button>

                    <button
                        className={`toolbar-btn ${collapseMode === 2 ? 'active' : ''}`}
                        onClick={() => handleModeChange(2, 'Titles')}
                        title="Titles View"
                    >
                        <div className="icon-rects titles">
                            <span></span>
                        </div>
                    </button>
                </div>

                <div className="toolbar-group">
                    <button
                        className="toolbar-btn"
                        onClick={() => handleCreate('title', 'Title')}
                        title="Add Title"
                    >
                        <div className="icon-letter bold-t">T</div>
                    </button>

                    <button
                        className="toolbar-btn"
                        onClick={() => handleCreate('text', 'Text')}
                        title="Add Text"
                    >
                        <div className="icon-letter small-t">t</div>
                    </button>

                    <button
                        className="toolbar-btn"
                        onClick={() => handleCreate('surface', 'Surface')}
                        title="Add Surface"
                    >
                        <div className="icon-surface"></div>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CanvasToolbar;
