import React, { memo } from 'react';
import { Handle, Position } from 'reactflow';

export default memo(({ data, isConnectable }) => {
    const elements = data.elements || [{ label: data.label, type: 'title', content: data.label }];

    return (
        <div className="custom-node-stacked">
            {elements.map((element, index) => (
                <div
                    key={index}
                    className={`node-element element-type-${element.type || 'default'} element-label-${(element.label || '').toLowerCase()}`}
                >

                    {element.type !== 'title' && (
                        <Handle
                            type="target"
                            position={Position.Left}
                            id={`target-${index}`}
                            isConnectable={isConnectable}
                            className="element-handle"
                        />
                    )}

                    <div className="element-content">
                        {element.type === 'title' ? (
                            <div className="element-title">{element.content}</div>
                        ) : (
                            <>
                                <div className="element-list-label">{element.label}</div>
                                {element.items && element.items.length > 0 && (
                                    <ul className="element-list">
                                        {element.items.map((item, idx) => (
                                            <li key={idx}>{item}</li>
                                        ))}
                                    </ul>
                                )}
                            </>
                        )}
                    </div>

                    {element.type !== 'title' && (
                        <Handle
                            type="source"
                            position={Position.Right}
                            id={`source-${index}`}
                            isConnectable={isConnectable}
                            className="element-handle"
                        />
                    )}
                </div>
            ))}
        </div>
    );
});
