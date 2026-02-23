const express = require('express');
const cors = require('cors');
const crypto = require('crypto'); // Add this to simulate the A3 Algorithm
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json()); // Allows the server to read JSON data

// A simple test route to ensure the server is alive
app.get('/api/network-status', (req, res) => {
    res.json({ 
        status: "Online", 
        message: "Airtel Mini-MSC Server is running",
        timestamp: new Date()
    });
});

// Route to get all subscribers (Querying the HLR)
app.get('/api/hlr/subscribers', (req, res) => {
    db.all("SELECT imsi, msisdn, account_balance, is_active FROM subscribers", [], (err, rows) => {
        if (err) {
            res.status(500).json({ error: err.message });
            return;
        }
        res.json({ data: rows });
    });
});
// Route to Register a new SIM (Provisioning in HLR)
app.post('/api/hlr/register', (req, res) => {
    // We expect the frontend to send the phone number and the secret key
    const { msisdn, ki_key } = req.body;

    if (!msisdn || !ki_key) {
        return res.status(400).json({ error: "MSISDN and ki_key are required." });
    }

    // Generate a mock IMSI 
    // Airtel Nigeria's Mobile Country Code (MCC) is 621 and Network Code (MNC) is 20
    const imsi = "62120" + Math.floor(1000000000 + Math.random() * 9000000000).toString();

    // SQL query to insert the new user
    const sql = `INSERT INTO subscribers (imsi, msisdn, ki_key) VALUES (?, ?, ?)`;
    
    db.run(sql, [imsi, msisdn, ki_key], function(err) {
        if (err) {
            // If the phone number already exists, SQLite will throw an error
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({
            message: "SIM successfully registered in HLR",
            data: {
                imsi: imsi,
                msisdn: msisdn,
                account_balance: 0.0,
                status: "Active"
            }
        });
    });
});
// Start the server
const PORT = 3000;
// --- STEP 1: The Network issues a Challenge (RAND) ---
app.get('/api/hlr/challenge/:imsi', (req, res) => {
    const imsi = req.params.imsi;

    // Check if the IMSI exists in the HLR
    db.get(`SELECT ki_key FROM subscribers WHERE imsi = ?`, [imsi], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "IMSI not found in HLR. Access Denied." });

        // Generate a 16-byte random hex string (The RAND)
        const rand = crypto.randomBytes(16).toString('hex');
        
        res.json({
            message: "Authentication Challenge Issued",
            imsi: imsi,
            RAND: rand
        });
    });
});

// --- STEP 2: The Network verifies the MS Response (SRES) ---
app.post('/api/hlr/authenticate', (req, res) => {
    const { imsi, rand, client_sres } = req.body;

    // Look up the secret key for this SIM
    db.get(`SELECT ki_key FROM subscribers WHERE imsi = ?`, [imsi], (err, user) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!user) return res.status(404).json({ error: "IMSI not found" });

        // The Network AuC calculates its own SRES using the RAND and the stored Ki Key
        // We use HMAC-SHA256 to simulate the GSM A3 Algorithm
        const network_sres = crypto.createHmac('sha256', user.ki_key)
                                   .update(rand)
                                   .digest('hex');

        // Compare the SIM's response to the Network's calculation
        if (client_sres === network_sres) {
            res.json({
                status: "Success",
                message: "Authentication Successful. SIM is valid.",
                network_sres: network_sres
            });
        } else {
            res.status(401).json({
                status: "Failed",
                message: "Authentication Failed. SRES mismatch (Possible cloned SIM).",
                expected: network_sres,
                received: client_sres
            });
        }
    });
});
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});