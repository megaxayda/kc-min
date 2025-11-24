const express = require("express");
const session = require("express-session");
const axios = require("axios");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 5174;

// Load Keycloak configuration
const config = JSON.parse(fs.readFileSync("./keycloak-config.json", "utf8"));

// Session middleware
app.use(
  session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }, // Set to true if using HTTPS
  })
);

// Serve static files
app.use(express.static("public"));

// Home route - serves login page
app.get("/", (req, res) => {
  if (req.session.accessToken) {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Keycloak Auth - Logged In</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 50px auto; padding: 20px; }
          .token-box { background: #f4f4f4; padding: 15px; border-radius: 5px; word-break: break-all; margin: 20px 0; }
          button { padding: 10px 20px; font-size: 16px; cursor: pointer; background: #d32f2f; color: white; border: none; border-radius: 4px; }
          button:hover { background: #b71c1c; }
        </style>
      </head>
      <body>
        <h1>✓ Authenticated</h1>
        <p>You are logged in!</p>
        <h3>Access Token:</h3>
        <div class="token-box">${req.session.accessToken}</div>
        <button onclick="window.location.href='/logout'">Logout</button>
      </body>
      </html>
    `);
  } else {
    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Keycloak Auth - Login</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 600px; margin: 50px auto; padding: 20px; text-align: center; }
          button { padding: 15px 30px; font-size: 18px; cursor: pointer; background: #1976d2; color: white; border: none; border-radius: 4px; }
          button:hover { background: #1565c0; }
          .info { margin-top: 30px; text-align: left; background: #f9f9f9; padding: 15px; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>Keycloak Authentication</h1>
        <p>Click the button below to login with Keycloak</p>
        <button onclick="window.location.href='/login'">Login with Keycloak</button>
        
        <div class="info">
          <h3>Configuration:</h3>
          <p><strong>Keycloak Server:</strong> ${config.serverUrl}</p>
          <p><strong>Realm:</strong> ${config.realm}</p>
          <p><strong>Client ID:</strong> ${config.clientId}</p>
        </div>
      </body>
      </html>
    `);
  }
});

// Login route - redirects to Keycloak
app.get("/login", (req, res) => {
  const authUrl = `${config.serverUrl}/realms/${config.realm}/protocol/openid-connect/auth`;
  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: config.redirectUri,
    response_type: "code",
    scope: "openid",
  });

  res.redirect(`${authUrl}?${params.toString()}`);
});

// Callback route - handles Keycloak redirect
app.get("/callback", async (req, res) => {
  const code = req.query.code;

  if (!code) {
    return res.status(400).send("Authorization code not found");
  }

  try {
    // Exchange authorization code for access token
    const tokenUrl = `${config.serverUrl}/realms/${config.realm}/protocol/openid-connect/token`;

    const params = new URLSearchParams({
      grant_type: "authorization_code",
      code: code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
      client_secret: config.clientSecret,
    });

    const response = await axios.post(tokenUrl, params.toString(), {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
    });

    // Store tokens in session
    req.session.accessToken = response.data.access_token;
    req.session.refreshToken = response.data.refresh_token;
    req.session.idToken = response.data.id_token;

    // Redirect to home page
    res.redirect("/");
  } catch (error) {
    console.error("Error exchanging code for token:", error.response?.data || error.message);
    res.status(500).send(`
      <!DOCTYPE html>
      <html>
      <head><title>Authentication Error</title></head>
      <body>
        <h1>Authentication Failed</h1>
        <p>Error: ${error.response?.data?.error_description || error.message}</p>
        <a href="/">Back to Home</a>
      </body>
      </html>
    `);
  }
});

// Logout route
app.get("/logout", (req, res) => {
  const idToken = req.session.idToken;
  req.session.destroy();

  // Redirect to Keycloak logout
  const logoutUrl = `${config.serverUrl}/realms/${config.realm}/protocol/openid-connect/logout`;
  const params = new URLSearchParams({
    post_logout_redirect_uri: config.logoutRedirectUri,
    id_token_hint: idToken,
  });

  res.redirect(`${logoutUrl}?${params.toString()}`);
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Keycloak configuration loaded from keycloak-config.json`);
});
