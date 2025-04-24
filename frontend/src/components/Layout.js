import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import './Layout.css'; // Optional styling

function Layout({ isLoggedIn, setIsLoggedIn }) {
    return (
        <div className="layout-container">
            <Sidebar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
            <div className="content-container">
                <Outlet /> {/* Render child routes */}
            </div>
        </div>
    );
}

export default Layout;