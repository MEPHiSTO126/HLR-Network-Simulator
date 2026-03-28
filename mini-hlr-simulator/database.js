const sqlite3 = require('sqlite3').verbose();

// This creates a local file named 'telecom.db' to store your data
const db = new sqlite3.Database('./telecom.db', (err) => {
    if (err) {
        console.error("Error opening database " + err.message);
    } else {
        console.log("Connected to the SQLite database.");
        
        // 1. Create the HLR Table (Subscribers)
        db.run(`CREATE TABLE IF NOT EXISTS subscribers (
            imsi TEXT PRIMARY KEY,          -- The unique SIM ID
            msisdn TEXT UNIQUE NOT NULL,    -- The public phone number
            ki_key TEXT NOT NULL,           -- The secret auth key (Never shared!)
            account_balance REAL DEFAULT 0.0,
            is_active BOOLEAN DEFAULT 1
        )`);

        // 2. Create the VLR Table (Location Registry)
        db.run(`CREATE TABLE IF NOT EXISTS vlr_location (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            imsi TEXT,
            current_msc_id TEXT,            -- e.g., 'MSC_IBADAN_01'
            last_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (imsi) REFERENCES subscribers(imsi)
        )`);

        // 3. Create the Billing Table (Call Data Records - CDR)
        db.run(`CREATE TABLE IF NOT EXISTS call_records (
            call_id INTEGER PRIMARY KEY AUTOINCREMENT,
            caller_msisdn TEXT,
            receiver_msisdn TEXT,
            duration_seconds INTEGER,
            cost REAL,
            call_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`);

        console.log("GSM Tables (HLR, VLR, Billing) initialized successfully.");
    }
});

module.exports = db;