# GSM Network Subsystem (NSS) Simulator 📡

A full-stack simulation of a telecommunications Network Switching Subsystem (NSS), featuring a functional Home Location Register (HLR), Authentication Center (AuC), and Call Data Record (CDR) billing engine. 

This project was developed to bridge the gap between theoretical telecommunications infrastructure and practical software engineering during a SIWES internship at Airtel Nigeria.

## 🚀 Features

* **SIM Provisioning (HLR):** Register new mobile subscribers, securely generating and storing an IMSI and cryptographic `Ki` key.
* **Cryptographic Authentication (AuC):** Simulates the GSM Challenge-Response handshake. The network issues a 16-byte `RAND` challenge, and the frontend (simulating the SIM card) uses the A3 algorithm (via HMAC-SHA256) to calculate a Signed Response (`SRES`) without transmitting the private key over the network.
* **Call Simulation & Billing (MSC/VLR):** Simulates call setup and dynamically deducts airtime balances based on call duration, generating Call Data Records (CDRs) in the database.
* **NOC Dashboard:** A React-based front-end interface mimicking a Network Operating Center (NOC) terminal with real-time activity logs.

## 🛠️ Tech Stack

* **Frontend:** React.js, Vite, Axios, Crypto-JS (for client-side SIM cryptography)
* **Backend:** Node.js, Express.js, native `crypto` module
* **Database:** SQLite3 (Serverless, local relational database)

## ⚙️ Local Setup & Installation

To run this simulation on your local machine, you will need to run both the backend server and the frontend development environment simultaneously.

### 1. Start the Core Network (Backend)
Open a terminal and navigate to the project's root/backend directory:
```bash
# Install dependencies
npm install

# Start the Node.js / Express server (MSC)
node server.js
The server will initialize a local telecom.db SQLite file on its first run and listen on port 3000.

2. Start the NOC Interface (Frontend)
Open a second, separate terminal and navigate to the hlr-frontend directory:
cd hlr-frontend

# Install dependencies (ignoring strict peer dependency conflicts)
npm install --legacy-peer-deps

# Start the React development server
npm run dev
Open your browser and navigate to the local URL provided (usually http://localhost:5173).

📖 How to Use the Simulator
Provision: Enter a phone number (e.g., +234...) and a secret key to register a new user. The system will auto-generate an International Mobile Subscriber Identity (IMSI).

Authenticate: Use the generated IMSI and secret key to trigger the AuC handshake. Watch the terminal logs as the RAND challenge and SRES response are calculated and verified.

Simulate Call: Once authenticated, enter a receiver's phone number and a call duration. The system will calculate the cost (at 12 Kobo/second) and update the live HLR database balance.
👨‍💻 Author
Ola Computer Science | University of Ibadan

GitHub: @MEPHiSTO126


### Final GitHub Steps
Once you have saved this `README.md` and your `.gitignore` file, you can push it all up to your repository:

```bash
git add .
git commit -m "Initial commit: Complete Mini-HLR Simulator with Auth and Billing"
git branch -M main
git push -u origin main