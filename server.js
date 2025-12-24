const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    fs.readFile('index.html', (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('Not found');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });
  }
});

const wss = new WebSocket.Server({ server });

const rooms = {};

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      const { room, senderId } = msg;

      if (!room || !senderId) return;

      if (!rooms[room]) rooms[room] = new Set();
      rooms[room].add(ws);

      // Рассылаем ВСЕМ в комнате, включая отправителя (он сам отфильтрует)
      rooms[room].forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(msg));
        }
      });
    } catch (e) {
      console.error('Ошибка сигнала:', e);
    }
  });

  ws.on('close', () => {
    for (const room in rooms) {
      rooms[room].delete(ws);
      if (rooms[room].size === 0) delete rooms[room];
    }
  });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});