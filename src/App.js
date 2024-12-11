import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';  // Ensure axios is imported
import './App.css';

function App() {
    const [totalTickets, setTotalTickets] = useState("");
    const [ticketReleaseRate, setTicketReleaseRate] = useState("");
    const [customerRetrievalRate, setCustomerRetrievalRate] = useState("");
    const [maxTicketCapacity, setMaxTicketCapacity] = useState("");
    const [notification, setNotification] = useState("");
    const [logs, setLogs] = useState([]);
    const [isRunning, setIsRunning] = useState(false);
    const backendUrl = "http://localhost:8080/api";
    const intervalRef = useRef(null); // Store the interval ID

    // WebSocket to receive real-time updates from the backend
    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080/ticket-status'); // WebSocket connection

        socket.onopen = () => {
            console.log('WebSocket connected');
            setNotification("WebSocket connected to the backend.");
        };

        socket.onmessage = (event) => {
            const newLog = event.data;

            if (newLog) {
                // Clean up the logs to remove any unwanted data (like "current size")
                const logWithoutCurrentSize = newLog.replace(/current size is - \d+/g, '').trim();  // Clean up the log
                setLogs((prevLogs) => [...prevLogs, logWithoutCurrentSize]);
            }
        };

        socket.onerror = (error) => {
            console.error('WebSocket error:', error);
            setNotification("Error: Unable to connect to the WebSocket server.");
        };

        return () => {
            socket.close();
        };
    }, []);

    // Fetch logs from the backend at regular intervals
    useEffect(() => {
        if (isRunning) {
            intervalRef.current = setInterval(async () => {
                try {
                    const response = await axios.get(`${backendUrl}/logs`);
                    const logsWithoutCurrentSize = response.data.map((log) =>
                        log.replace(/current size is - \d+/g, '').trim()  // Remove hyphens and current size info
                    );
                    setLogs(logsWithoutCurrentSize); // Update logs in real-time
                } catch (error) {
                    console.error("Error fetching logs:", error);
                }
            }, 1000); // Fetch logs every second
        } else {
            clearInterval(intervalRef.current); // Clear interval when stopped
        }

        return () => clearInterval(intervalRef.current); // Cleanup interval on unmount
    }, [isRunning]);

    const handleSaveConfiguration = async () => {
        if (!validateInputs()) return;

        const configuration = {
            totalTickets: Number(totalTickets),
            ticketReleaseRate: Number(ticketReleaseRate),
            customerRetrievalRate: Number(customerRetrievalRate),
            maxTicketCapacity: Number(maxTicketCapacity),
        };

        try {
            await axios.post(`${backendUrl}/configure`, configuration);
            setNotification("Configuration saved successfully.");
        } catch (error) {
            console.error("Error saving configuration:", error);
            setNotification("❌ Failed to save configuration. Check the server connection.");
        }
    };

    const handleStart = () => {
        if (!validateInputs()) return;
        setIsRunning(true);
        setLogs([]);  // Clear logs on start
        setNotification("System started.");
    };

    const handleStop = () => {
        setIsRunning(false);
        setNotification("System stopped.");
    };

    const validateInputs = () => {
        if (!totalTickets || !ticketReleaseRate || !customerRetrievalRate || !maxTicketCapacity) {
            setNotification("⚠️ Please fill in all fields.");
            return false;
        }
        if (isNaN(totalTickets) || isNaN(ticketReleaseRate) || isNaN(customerRetrievalRate) || isNaN(maxTicketCapacity)) {
            setNotification("⚠️ All inputs must be valid numbers.");
            return false;
        }
        if (Number(totalTickets) <= 0 || Number(ticketReleaseRate) <= 0 || Number(customerRetrievalRate) <= 0 || Number(maxTicketCapacity) <= 0) {
            setNotification("⚠️ All values must be positive numbers.");
            return false;
        }
        return true;
    };

    return (
        <div className="app">
            <h2>Ticketing System Configuration</h2>

            {/* Configuration Form */}
            <div className="system-configuration">
                <div>
                    <label>Total Tickets:</label>
                    <input
                        type="text"
                        value={totalTickets}
                        onChange={(e) => setTotalTickets(e.target.value)}
                    />
                </div>
                <div>
                    <label>Ticket Release Rate (in seconds):</label>
                    <input
                        type="text"
                        value={ticketReleaseRate}
                        onChange={(e) => setTicketReleaseRate(e.target.value)}
                    />
                </div>
                <div>
                    <label>Customer Retrieval Rate (in seconds):</label>
                    <input
                        type="text"
                        value={customerRetrievalRate}
                        onChange={(e) => setCustomerRetrievalRate(e.target.value)}
                    />
                </div>
                <div>
                    <label>Maximum Ticket Capacity:</label>
                    <input
                        type="text"
                        value={maxTicketCapacity}
                        onChange={(e) => setMaxTicketCapacity(e.target.value)}
                    />
                </div>
                <button onClick={handleSaveConfiguration}>Save Configuration</button>
            </div>

            {/* Notifications */}
            {notification && <div className="notification">{notification}</div>}

            {/* Ticket Logs */}
            <div className="Ticket_name">
                <h3>Ticket Status</h3>
                <div className="Ticket_name-content">
                    {logs.map((log, index) => (
                        <div key={index}>{log}</div>
                    ))}
                </div>
            </div>

            {/* Control Buttons */}
            <div className="control-buttons">
                <button
                    className="start-button"
                    onClick={handleStart}
                    disabled={isRunning}
                >
                    Start
                </button>
                <button
                    className="stop-button"
                    onClick={handleStop}
                    disabled={!isRunning}
                >
                    Stop
                </button>
            </div>
        </div>
    );
}

export default App;
