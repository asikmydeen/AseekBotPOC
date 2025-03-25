// proxy-server.js
// This proxy server is used to bypass CORS issues during local development.
// In production, the actual API should include appropriate CORS headers.
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');

const app = express();
const PORT = 3001;

// Enable CORS for all requests
// This allows the frontend to communicate with this proxy during development
app.use(cors());

// Configure proxy middleware
const apiProxy = createProxyMiddleware({
    target: 'https://api-dev-ammydeen.alpha.aseekbot.ammydeen.people.aws.dev',
    changeOrigin: true,
    pathRewrite: {
        '^/api': '', // remove '/api' prefix when forwarding
    },
    onProxyRes: (proxyRes) => {
        // Modify response headers to allow CORS
        // These headers ensure the browser accepts the responses from the proxied API
        // Note: In production, the actual API should include these headers if being accessed directly
        proxyRes.headers['Access-Control-Allow-Origin'] = '*';
        proxyRes.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        proxyRes.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization';
    },
    logLevel: 'debug',
});

// Apply the proxy middleware to all routes starting with /api
// This forwards requests from localhost:3001/api/* to the actual API endpoint
app.use('/api', apiProxy);

// Start the server
// This development proxy should not be used in production environments
app.listen(PORT, () => {
    console.log(`Proxy server running at http://localhost:${PORT}`);
});
