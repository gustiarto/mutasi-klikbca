# mutasi-klikbca

## Project Purpose
This project automates the retrieval of account mutation (transaction history) from KlikBCA Individual using Puppeteer and exposes it as a secure HTTP API. It also supports scheduled (cron) fetching, deduplication, and webhook notification for new transactions, with all data stored in a local JSON file database.

## How It Works
- The service logs in to KlikBCA Individual using Puppeteer, navigates to the mutation page, and parses the transaction table into JSON.
- Every 10 minutes (or as configured), a cron job fetches the latest mutation data.
- New transactions (not previously seen) are appended to a local JSON database (`mutasi-db.json`) with a fetch timestamp and webhook status.
- For each new transaction, a POST request is sent to a configurable webhook URL. If Basic Auth is set, it is used for the webhook call.
- The API provides endpoints to fetch mutation data on demand and to view the local database.

## Features
- Automates KlikBCA login and navigation using Puppeteer
- Handles login errors (wrong credentials, session lock, etc.)
- Parses transaction table robustly to JSON
- Provides a secure HTTP POST endpoint to fetch mutation data
- Supports Bearer Token authentication for API security
- Ready for Docker deployment
- Cron job for scheduled data fetching
- Webhook notification for new transactions
- Local JSON file database for storing mutation data

## Requirements
- Node.js 18+ (or use Docker)
- KlikBCA Individual account credentials

## Usage

### 1. Clone & Install
```sh
git clone <your-repo-url>
cd mutasi-klikbca
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your credentials and config:
```
KLIKBCA_USER_ID=your_user_id
KLIKBCA_PIN=your_pin
WEBHOOK_URL=https://your-webhook-url.com/endpoint
WEBHOOK_BASIC_USER=your_webhook_user
WEBHOOK_BASIC_PASS=your_webhook_pass
AUTH_TOKEN=klikbca-secret-token
PORT=3040
CRON_INTERVAL=*/10 * * * *
```

### 3. Run Locally
```sh
node index.js
```
The API will listen on port 3040 by default.

### 4. Run with Docker
```sh
docker build -t mutasi-klikbca .
docker run -p 3040:3040 --env-file .env mutasi-klikbca
```

## API Endpoints

### `POST /mutasi`
Fetch mutation data from KlikBCA on demand.

**Headers:**
```
Authorization: Bearer klikbca-secret-token
Content-Type: application/json
```
**Body:**
```json
{
  "user_id": "YOUR_KLIKBCA_USERID",
  "pin": "YOUR_KLIKBCA_PIN"
}
```
**Success Response:**
```json
{
  "success": true,
  "data": [
    {
      "tanggal": "dd/mm",
      "keterangan": "...",
      "cabang": "...",
      "mutasi": "...",
      "tipe": "DB/CR",
      "saldo": "..."
    },
    ...
  ]
}
```
**Error Response:**
```json
{
  "success": false,
  "error": "Login gagal: User ID atau PIN salah."
}
```

### `GET /mutasi-db`
Get all stored mutation data from the local JSON database.

**Headers:**
```
Authorization: Bearer klikbca-secret-token
```
**Success Response:**
```json
{
  "tanggal": "...",
  "keterangan": "...",
  "cabang": "...",
  "mutasi": "...",
  "tipe": "...",
  "saldo": "...",
  "fetch_datetime": "2025-07-07T12:34:56.789Z",
  "status_webhook": {
    "entryid": "...",
    "uniqueid": "..."
  }
}
```

## Webhook Notification
- For each new transaction, a POST request is sent to the webhook URL with the transaction details as JSON.
- If Basic Auth is set, it is used for the webhook call.
- The webhook response should contain `entryid` and `uniqueid` fields, which will be stored in the database.

## Security Notes
- Never commit your real KlikBCA credentials.
- Change the default AUTH_TOKEN for production.
- Use HTTPS in production for secure credential transmission.

## License
MIT
