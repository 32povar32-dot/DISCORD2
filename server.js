const WebSocket = require('ws');
const http = require('http');
const fs = require('fs');

// HTTP-сервер для раздачи index.html
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

// WebSocket-сервер
const wss = new WebSocket.Server({ server });

// Хранилище комнат: { roomName: [ws1, ws2, ...] }
const rooms = {};

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    try {
      const msg = JSON.parse(data);
      const { room, type, payload } = msg;

      if (!rooms[room]) rooms[room] = [];
      if (!rooms[room].includes(ws)) rooms[room].push(ws);

      // Пересылаем сигнал всем в комнате, кроме отправителя
      rooms[room].forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type, payload }));
        }
      });
    } catch (e) {
      console.error('Ошибка сигнала:', e);
    }
  });

  ws.on('close', () => {
    // Удаляем клиента из всех комнат
    for (const room in rooms) {
      rooms[room] = rooms[room].filter(client => client !== ws);
      if (rooms[room].length === 0) delete rooms[room];
    }
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});