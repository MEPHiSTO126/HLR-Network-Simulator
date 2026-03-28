import { useState, useEffect } from 'react';
import axios from 'axios';
import CryptoJS from 'crypto-js';
import './App.css';

const API_BASE = import.meta.env.VITE_API_BASE;

function App() {
  const [callDuration, setCallDuration] = useState(60);
  const [receiver, setReceiver] = useState('');
  const [subscribers, setSubscribers] = useState([]);
  const [logs, setLogs] = useState([]);

  // Form States
  const [regPhone, setRegPhone] = useState('');
  const [regKey, setRegKey] = useState('secret_a3_key_998877');

  const [authImsi, setAuthImsi] = useState('');
  const [authKey, setAuthKey] = useState('secret_a3_key_998877');

  const fetchSubscribers = async () => {
    try {
      const res = await axios.get(`${API_BASE}/subscribers`);
      setSubscribers(res.data.data);
    } catch (err) {
      addLog('Error fetching HLR database', 'error');
    }
  };

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const addLog = (msg, type = 'info') => {
    setLogs(prev => [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev]);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/register`, {
        msisdn: regPhone,
        ki_key: regKey,
      });
      addLog(`SIM Registered! IMSI: ${res.data.data.imsi}`, 'success');
      setAuthImsi(res.data.data.imsi);
      fetchSubscribers();
    } catch (err) {
      addLog(`Registration Failed: ${err.response?.data?.error || err.message}`, 'error');
    }
  };

  const handleAuthenticate = async (e) => {
    e.preventDefault();
    addLog(`Initiating connection for IMSI: ${authImsi}...`);
    try {
      const challengeRes = await axios.get(`${API_BASE}/challenge/${authImsi}`);
      const rand = challengeRes.data.RAND;
      addLog(`Network Challenge (RAND) received: ${rand.substring(0, 8)}...`);
      addLog(`SIM calculating SRES using A3 Algorithm...`);
      const client_sres = CryptoJS.HmacSHA256(rand, authKey).toString(CryptoJS.enc.Hex);
      const authRes = await axios.post(`${API_BASE}/authenticate`, {
        imsi: authImsi,
        rand: rand,
        client_sres: client_sres,
      });
      addLog(`Network Verdict: ${authRes.data.message}`, 'success');
    } catch (err) {
      addLog(`Auth Failed: ${err.response?.data?.message || err.message}`, 'error');
    }
  };

  const handleCall = async (e) => {
    e.preventDefault();
    if (!authImsi) return addLog('Please Authenticate a SIM first!', 'error');
    try {
      addLog(`Connecting call to ${receiver}...`);
      const res = await axios.post(`${API_BASE}/../msc/call`, {
        caller_imsi: authImsi,
        receiver_msisdn: receiver,
        duration_seconds: callDuration,
      });
      addLog(`Call ended. Duration: ${res.data.duration}s. Cost: ₦${res.data.cost_deducted}`, 'success');
      fetchSubscribers();
    } catch (err) {
      addLog(`Call Failed: ${err.message}`, 'error');
    }
  };

  return (
    <div className="dashboard-container">

      {/* ── HEADER ── */}
      <header className="header">
        <div className="header-text">
          <h1>NOC Core <span>Simulator</span></h1>
          <p>Airtel SIWES · Network Switching Subsystem Prototype · Mini-HLR</p>
        </div>
        <div className="header-badge">
          <div className="pulse-dot" />
          System Online
        </div>
      </header>

      <div className="main-grid">

        {/* ── LEFT COLUMN ── */}
        <div className="control-panel">

          {/* REGISTER */}
          <div className="card">
            <div className="card-header">
              <div className="step-badge">01</div>
              <h2>Register New SIM (HLR)</h2>
            </div>
            <form onSubmit={handleRegister}>
              <div className="input-group">
                <span className="input-label">MSISDN / Phone Number</span>
                <input
                  type="text"
                  placeholder="+234802xxxxxxx"
                  value={regPhone}
                  onChange={e => setRegPhone(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <span className="input-label">Secret Ki Key</span>
                <input
                  type="text"
                  placeholder="Ki authentication key"
                  value={regKey}
                  onChange={e => setRegKey(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary">
                Register SIM → HLR
              </button>
            </form>
          </div>

          {/* AUTHENTICATE */}
          <div className="card">
            <div className="card-header">
              <div className="step-badge">02</div>
              <h2>Simulate Network Auth (AuC)</h2>
            </div>
            <form onSubmit={handleAuthenticate}>
              <div className="input-group">
                <span className="input-label">Target IMSI</span>
                <input
                  type="text"
                  placeholder="15-digit IMSI"
                  value={authImsi}
                  onChange={e => setAuthImsi(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <span className="input-label">SIM Secret Key (Ki)</span>
                <input
                  type="text"
                  placeholder="Must match registered Ki"
                  value={authKey}
                  onChange={e => setAuthKey(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-secondary">
                Trigger GSM Handshake
              </button>
            </form>
          </div>

          {/* CALL */}
          <div className="card">
            <div className="card-header">
              <div className="step-badge">03</div>
              <h2>Network Switch (MSC / Billing)</h2>
            </div>
            <form onSubmit={handleCall}>
              <div className="input-group">
                <span className="input-label">Receiver MSISDN</span>
                <input
                  type="text"
                  placeholder="Destination phone number"
                  value={receiver}
                  onChange={e => setReceiver(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <span className="input-label">Call Duration (seconds)</span>
                <input
                  type="number"
                  placeholder="Duration in seconds"
                  value={callDuration}
                  onChange={e => setCallDuration(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-green">
                Simulate Call &amp; Bill
              </button>
            </form>
          </div>

          {/* LOGS */}
          <div className="card terminal">
            <h3>Network Activity Log</h3>
            <div className="log-window">
              {logs?.length === 0
                ? <div className="log-entry" style={{ color: '#2a5c3a' }}>Awaiting network events...</div>
                : logs?.map((log, i) => (
                    <div key={i} className="log-entry">{log}</div>
                  ))
              }
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="data-panel card">
          <h2>Live HLR Database</h2>
          {subscribers?.length === 0 ? (
            <div className="empty-state">
              No subscribers registered yet.<br />Register a SIM to populate the database.
            </div>
          ) : (
            <table className="hlr-table">
              <thead>
                <tr>
                  <th>IMSI (SIM ID)</th>
                  <th>MSISDN (Phone)</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {subscribers?.map(sub => (
                  <tr key={sub.imsi}>
                    <td>{sub.imsi}</td>
                    <td>{sub.msisdn}</td>
                    <td>
                      <span className="status-badge active">Active</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
}

export default App;
