# mutasi-klikbca

Automated KlikBCA Individual Web Scraper for Account Mutation (Transaction History)

## Overview
This project provides a Node.js (Express) API to automate the retrieval of account mutation (transaction history) from KlikBCA Individual using Puppeteer. It logs in, navigates the menu, parses the transaction table, and returns the result as JSON. The service is containerized with Docker for easy deployment.

## Features
- Automates KlikBCA login and navigation using Puppeteer
- Handles login errors (wrong credentials, session lock, etc.)
- Parses transaction table robustly to JSON
- Provides a secure HTTP POST endpoint to fetch mutation data
- Supports Bearer Token authentication for API security
- Ready for Docker deployment

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

### 2. Run Locally
```sh
node index.js
```
The API will listen on port 3040 by default.

### 3. Run with Docker
```sh
docker build -t mutasi-klikbca .
docker run -p 3040:3040 -e AUTH_TOKEN=your-secret-token mutasi-klikbca
```

### 4. API Endpoint
**POST /mutasi**

Request headers:
```
Authorization: Bearer your-secret-token
Content-Type: application/json
```

Request body:
```json
{
  "user_id": "YOUR_KLIKBCA_USERID",
  "pin": "YOUR_KLIKBCA_PIN"
}
```

Response:
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

## Security Notes
- **Never commit your real KlikBCA credentials.** Use environment variables or secrets management.
- The API is protected with Bearer Token. Change the default token for production.
- Use HTTPS in production for secure credential transmission.

## Limitations
- This tool is for educational and personal automation use only. Use responsibly and comply with KlikBCA's terms of service.
- The HTML structure of KlikBCA may change and require code updates.

## License
MIT
