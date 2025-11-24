# Minimal Keycloak Node.js Authentication

A minimal Node.js application demonstrating Keycloak authentication with OAuth2/OIDC flow.

## Features

- Login button that redirects to Keycloak login page
- Authorization code flow with PKCE
- Retrieves and displays access token
- Callback page for handling authentication response
- Logout functionality
- Easy configuration via JSON file

## Prerequisites

- Node.js (v14 or higher)
- Keycloak server running (default: http://localhost:8080)

## Configuration

Edit `keycloak-config.json` to match your Keycloak setup:

```json
{
  "serverUrl": "http://localhost:8080",
  "realm": "myrealm",
  "clientId": "myclient",
  "clientSecret": "your-client-secret",
  "redirectUri": "http://localhost:3000/callback",
  "logoutRedirectUri": "http://localhost:3000"
}
```

### Keycloak Client Setup

1. Create a new client in your Keycloak realm
2. Set **Client Protocol**: `openid-connect`
3. Set **Access Type**: `confidential`
4. Add **Valid Redirect URIs**: `http://localhost:3000/callback`
5. Add **Web Origins**: `http://localhost:3000`
6. Copy the **Client Secret** from the Credentials tab to `keycloak-config.json`

## Installation

```bash
npm install
```

## Usage

Start the server:

```bash
npm start
```

Navigate to: http://localhost:3000

Click the "Login with Keycloak" button to authenticate.

## Routes

- `/` - Home page with login button (or token display if authenticated)
- `/login` - Redirects to Keycloak login page
- `/callback` - Handles Keycloak redirect and token exchange
- `/logout` - Logs out and redirects to Keycloak logout

## Project Structure

```
kc-min/
├── server.js              # Main Express server
├── keycloak-config.json   # Keycloak configuration
├── package.json           # Node.js dependencies
└── README.md             # Documentation
```

## Security Notes

- This is a minimal example for demonstration purposes
- In production:
  - Use HTTPS
  - Set secure session cookies
  - Store client secrets securely (environment variables)
  - Implement proper error handling
  - Add token validation and refresh logic
