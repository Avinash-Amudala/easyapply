// src/components/Sidebar.js
import React from 'react';
import './Sidebar.css';

function Sidebar() {
    return (
        <div className="sidebar">
            <ul>
                <li><a href="/dashboard">Dashboard</a></li>
                <li><a href="/jobs">Jobs</a></li>
                <li><a href="/profile">Profile</a></li>
                <li><a href="/preferences">Preferences</a></li>
            </ul>
        </div>
    );
}

export default Sidebar;
