import React from 'react';

const HelperLines = ({ horizontal, vertical }) => {
    return (
        <svg
            style={{
                position: 'absolute',
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                zIndex: 10,
                top: 0,
                left: 0,
            }}
        >
            {horizontal !== null && (
                <line
                    x1="0"
                    y1={horizontal}
                    x2="100%"
                    y2={horizontal}
                    stroke="#3b82f6"
                    strokeWidth="1"
                    strokeDasharray="4"
                />
            )}
            {vertical !== null && (
                <line
                    x1={vertical}
                    y1="0"
                    x2={vertical}
                    y2="100%"
                    stroke="#3b82f6"
                    strokeWidth="1"
                    strokeDasharray="4"
                />
            )}
        </svg>
    );
};

export default HelperLines;
