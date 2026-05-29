const http = require('http');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const port = Number(process.env.PORT || 3000);

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
};

http
  .createServer((req, res) => {
    let urlPath = (req.url || '/').split('?')[0];
    if (urlPath === '/') {
      urlPath = '/index.html';
    }

    const filePath = path.normalize(path.join(root, decodeURIComponent(urlPath)));
    if (!filePath.startsWith(root)) {
      res.writeHead(403);
      res.end('Forbidden');
      return;
    }

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }

      res.writeHead(200, {
        'Content-Type': contentTypes[path.extname(filePath)] || 'application/octet-stream',
      });
      res.end(data);
    });
  })
  .listen(port, () => {
    console.log(`ChurchOS preview running at http://localhost:${port}`);
  });
