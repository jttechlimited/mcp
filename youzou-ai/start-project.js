const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 3000;

// MIME types for different file extensions
const mimeTypes = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// Create HTTP server
const server = http.createServer((req, res) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  
  const parsedUrl = url.parse(req.url);
  let pathname = parsedUrl.pathname;
  
  // Default to index.html for root path
  if (pathname === '/') {
    pathname = '/demo.html';
  }
  
  // Remove leading slash and resolve path
  const safePath = path.normalize(pathname.substring(1));
  
  // Security: prevent directory traversal
  if (safePath.includes('..')) {
    res.writeHead(403, { 'Content-Type': 'text/plain' });
    res.end('Access denied');
    return;
  }
  
  // Determine file path
  let filePath = path.join(__dirname, safePath);
  
  // Check if file exists
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      // Try with .html extension if not found
      if (!path.extname(safePath)) {
        filePath += '.html';
        fs.access(filePath, fs.constants.F_OK, (err2) => {
          if (err2) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            res.end('File not found');
          } else {
            serveFile(filePath, res);
          }
        });
      } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('File not found');
      }
    } else {
      serveFile(filePath, res);
    }
  });
});

function serveFile(filePath, res) {
  const ext = path.extname(filePath).toLowerCase();
  const contentType = mimeTypes[ext] || 'application/octet-stream';
  
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Error reading file');
      return;
    }
    
    res.writeHead(200, { 
      'Content-Type': contentType,
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization'
    });
    res.end(data);
  });
}

// Start server
server.listen(PORT, () => {
  console.log(`🚀 遊走 AI Project Server running at http://localhost:${PORT}`);
  console.log(`📱 Available demos:`);
  console.log(`   • Main Demo: http://localhost:${PORT}/demo.html`);
  console.log(`   • Mobile Preview: http://localhost:${PORT}/mobile-preview.html`);
  console.log(`   • Search Demo: http://localhost:${PORT}/search-demo.html`);
  console.log(`   • Web Preview: http://localhost:${PORT}/web-preview.html`);
  console.log(`   • Admin Portal: http://localhost:${PORT}/admin-settings.js`);
  console.log('');
  console.log(`🔧 Project Structure:`);
  console.log(`   • Backend: /server/index.js (requires npm install)`);
  console.log(`   • Mobile App: /mobile/ (React Native)`);
  console.log(`   • Web Admin: /client/ (React)`);
  console.log(`   • Demo Files: Available for preview`);
  console.log('');
  console.log(`💡 Note: For full functionality, run 'npm install' in the youzou-ai directory`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});