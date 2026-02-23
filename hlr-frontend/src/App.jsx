import { useState, useEffect } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import './App.css';

const API_BASE = 'http://localhost:3000/api/hlr';

function App() {
  const [subscribers, setSubscribers] = useState([]);
  const [logs, setLogs] = useState([]);
  
  // Form States
  const [regPhone, setRegPhone] = useState('');
  const [regKey, setRegKey] = useState('secret_a3_key_998877');
  
  const [authImsi, setAuthImsi] = useState('');
  const [authKey, setAuthKey] = useState('secret_a3_key_998877');

  // Load HLR Data
  const fetchSubscribers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/subscribers`);
      setSubscribers(res.data.data);
    } catch (err) {
      addLog("Error fetching HLR database", "error");
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const addLog = (msg, type = "info") => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 5));
  };

  // --- 1. SIMULATION: Register SIM ---
  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/register`, {
        msisdn: regPhone,
        ki_key: regKey
      });
      addLog(`SIM Registered! IMSI: ${res.data.data.imsi}`, "success");
      setAuthImsi(res.data.data.imsi); // Auto-fill auth form
      fetchSubscribers();
    } catch (err) {
      addLog(`Registration Failed: ${err.response?.data?.error || err.message}`, "error");
    }
  };

  // --- 2. SIMULATION: The GSM Handshake ---
  const handleAuthenticate = async (e) => {
    e.preventDefault();
    addLog(`Initiating connection for IMSI: ${authImsi}...`);
    
    try {
      // Step A: Network sends Challenge (RAND)
      const challengeRes = await axios.get(`${API_BASE}/challenge/${authImsi}`);
      const rand = challengeRes.data.RAND;
      addLog(`Network Challenge (RAND) received: ${rand.substring(0,8)}...`);

      // Step B: SIM Card calculates Response (SRES) using A3 Algorithm
      // We simulate the SIM's internal processor here on the frontend
      addLog(`SIM calculating SRES using A3 Algorithm...`);
      const client_sres = CryptoJS.HmacSHA256(rand, authKey).toString(CryptoJS.enc.Hex);

      // Step C: Send SRES back to Network MSC
      const authRes = await axios.post(`${API_BASE}/authenticate`, {
        imsi: authImsi,
        rand: rand,
        client_sres: client_sres
      });

      addLog(`Network Verdict: ${authRes.data.message}`, "success");
      
    } catch (err) {
      addLog(`Auth Failed: ${err.response?.data?.message || err.message}`, "error");
    }
  };

  return (
    <div className="dashboard-container">
      <header className="header">
        <h1>NOC Core Simulator (Mini-HLR)</h1>
        <p>Airtel SIWES Network Switching Subsystem Prototype</p>
      </header>

      <div className="main-grid">
        {/* Left Column: Controls */}
        <div className="control-panel">
          
          <div className="card">
            <h2>1. Provision New SIM (HLR)</h2>
            <form onSubmit={handleRegister}>
              <input type="text" placeholder="Phone (e.g. +234802...)" value={regPhone} onChange={e => setRegPhone(e.target.value)} required />
              <input type="text" placeholder="Secret Ki Key" value={regKey} onChange={e => setRegKey(e.target.value)} required />
              <button type="submit" className="btn-primary">Provision SIM</button>
            </form>
          </div>

          <div className="card">
            <h2>2. Simulate Network Auth (AuC)</h2>
            <form onSubmit={handleAuthenticate}>
              <input type="text" placeholder="Target IMSI" value={authImsi} onChange={e => setAuthImsi(e.target.value)} required />
              <input type="text" placeholder="SIM's Secret Key" value={authKey} onChange={e => setAuthKey(e.target.value)} required />
              <button type="submit" className="btn-secondary">Trigger Call Request</button>
            </form>
          </div>

          <div className="card terminal">
            <h3>Network Activity Logs</h3>
            <div className="log-window">
              {logs.map((log, i) => <div key={i} className="log-entry">{log}</div>)}
            </div>
          </div>

        </div>

        {/* Right Column: Database View */}
        <div className="data-panel card">
          <h2>Live HLR Database</h2>
          <table className="hlr-table">
            <thead>
              <tr>
                <th>IMSI (SIM ID)</th>
                <th>MSISDN (Phone)</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {subscribers.map(sub => (
                <tr key={sub.imsi}>
                  <td>{sub.imsi}</td>
                  <td>{sub.msisdn}</td>
                  <td><span className="status-badge active">Active</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default App;