import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAllUsers, getAllAssistants, assignAssistant, getAssistantProgress, createAssistant, logout } from '../api';
import './AdminDashboard.css';

function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [assistants, setAssistants] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedAssistant, setSelectedAssistant] = useState(null);
    const [progress, setProgress] = useState(null);
    const [newAssistant, setNewAssistant] = useState({ name: '', email: '', password: '' });
    const navigate = useNavigate();

    useEffect(() => {
        const role = localStorage.getItem('role');
        if (role !== 'admin') {
            alert('Access denied');
            navigate('/');
            return;
        }

        const fetchData = async () => {
            setUsers(await getAllUsers());
            setAssistants(await getAllAssistants());
        };
        fetchData();
    }, [navigate]);

    const handleLogout = async () => {
        await logout();
        alert("Logged out successfully!");
        navigate('/login'); // Redirect to login page
    };

    const handleAssign = async () => {
        await assignAssistant({ userId: selectedUser, assistantId: selectedAssistant });
        alert("Assistant Assigned!");
    };

    const handleCheckProgress = async (assistantId) => {
        setProgress(await getAssistantProgress(assistantId));
    };

    const handleCreateAssistant = async () => {
        if (!newAssistant.name || !newAssistant.email || !newAssistant.password) {
            alert("All fields are required!");
            return;
        }

        try {
            const response = await createAssistant(newAssistant);

            if (response.error) {
                alert(response.message);
                return;
            }

            alert("Assistant Created Successfully!");
            setNewAssistant({ name: '', email: '', password: '' });
            setAssistants(await getAllAssistants());
        } catch (error) {
            alert(error.response?.data?.message || "Server error");
        }
    };

    return (
        <div className="admin-dashboard">
            <h1>Admin Dashboard</h1>
            <button className="logout-button" onClick={handleLogout}>Logout</button> {/* ✅ Logout Button */}

            <div className="admin-section">
                <h2>Assign Assistants</h2>
                <select onChange={(e) => setSelectedUser(e.target.value)}>
                    <option>Select User</option>
                    {users.map(user => <option key={user._id} value={user._id}>{user.name}</option>)}
                </select>

                <select onChange={(e) => setSelectedAssistant(e.target.value)}>
                    <option>Select Assistant</option>
                    {assistants.map(assistant => <option key={assistant._id} value={assistant._id}>{assistant.name}</option>)}
                </select>

                <button onClick={handleAssign}>Assign</button>
            </div>

            <div className="admin-section">
                <h2>Track Assistant Progress</h2>
                {assistants.map(assistant => (
                    <div key={assistant._id}>
                        <span>{assistant.name}</span>
                        <button onClick={() => handleCheckProgress(assistant._id)}>View Progress</button>
                    </div>
                ))}
            </div>

            {progress && (
                <div className="admin-section">
                    <h3>Assistant Progress</h3>
                    <p>Jobs Delegated: {progress.jobs.length}</p>
                    <p>Average Time to Apply: {progress.stats.averageTime} hrs</p>
                </div>
            )}

            <div className="admin-section">
                <h2>Create Assistant</h2>
                <input type="text" placeholder="Name"
                       onChange={(e) => setNewAssistant({...newAssistant, name: e.target.value})}
                />
                <input type="email" placeholder="Email"
                       onChange={(e) => setNewAssistant({...newAssistant, email: e.target.value})}
                />
                <input type="password" placeholder="Password"
                       onChange={(e) => setNewAssistant({...newAssistant, password: e.target.value})}
                />
                <div className="password-requirements">
                    <p>Password must contain:</p>
                    <ul>
                        <li>Minimum 8 characters</li>
                        <li>At least one uppercase letter</li>
                        <li>At least one lowercase letter</li>
                        <li>At least one number</li>
                        <li>At least one special character</li>
                    </ul>
                </div>
                <button onClick={handleCreateAssistant}>Create</button>
            </div>
        </div>
    );
}

export default AdminDashboard;
