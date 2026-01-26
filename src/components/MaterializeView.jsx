import React, { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { loadMaterializeContent } from '../dataService';
import './MaterializeView.css';

const MaterializeView = () => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            const data = await loadMaterializeContent();
            setContent(data);
            setLoading(false);
        };
        fetchContent();
    }, []);

    if (loading) {
        return <div className="materialize-content">Loading...</div>;
    }

    return (
        <div className="materialize-content">
            <div className="markdown-body">
                <ReactMarkdown>{content}</ReactMarkdown>
            </div>
        </div>
    );
};

export default MaterializeView;
