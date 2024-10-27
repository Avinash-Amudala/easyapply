// src/components/Sidebar.js
import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

function Sidebar({ onLogout }) {
    return (
        <div className="sidebar">
            <h2>EasyApply</h2>
            <nav>
                <Link to="/dashboard">Dashboard</Link>
                <Link to="/jobs">Jobs</Link>
                <Link to="/profile">Profile</Link>
                <Link to="/preferences">Preferences</Link>
            </nav>
            <button className="logout-button" onClick={onLogout}>Logout</button>
        </div>
    );
}

export default Sidebar;
