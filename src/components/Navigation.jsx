import React from 'react';
import './Navigation.css';

const Navigation = ({ activeView, onViewChange }) => {
    const views = [
        { id: 'define', label: 'Define', icon: '✍️' },
        { id: 'explore', label: 'Explore', icon: '🗺️' },
        { id: 'materialize', label: 'Materialize', icon: '🏗️' }
    ];

    return (
        <nav className="main-navigation">
            <div className="nav-inner">
                {views.map(view => (
                    <button
                        key={view.id}
                        className={`nav-item ${activeView === view.id ? 'active' : ''}`}
                        onClick={() => onViewChange(view.id)}
                    >
                        <span className="nav-label">{view.label}</span>
                    </button>
                ))}
            </div>
        </nav>
    );
};

export default Navigation;
