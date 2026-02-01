const express = require('express'); 
const http = require('http'); 
const socketIo = require('socket.io'); 
const path = require('path'); 
 
const app = express(); 
const server = http.createServer(app); 
const io = socketIo(server, { 
  cors: { 
    origin: "*", 
    methods: ["GET", "POST"] 
  } 
}); 
 
app.use(express.static(path.join(__dirname, '../public'))); 
app.use('/public', express.static(path.join(__dirname, '../public'))); 
 
app.get('/', (req, res) =
  res.sendFile(path.join(__dirname, '../public/index.html')); 
}); 
 
const rooms = new Map(); 
 
function generateRoomId() { 
  return Math.random().toString(36).substring(2, 8).toUpperCase(); 
} 
 
function checkWinner(board) { 
  const winPatterns = [ 
    [0, 1, 2], [3, 4, 5], [6, 7, 8], 
    [0, 3, 6], [1, 4, 7], [2, 5, 8], 
    [0, 4, 8], [2, 4, 6] 
  ]; 
 
  for (let pattern of winPatterns) { 
    const [a, b, c] = pattern; 
      return board[a]; 
    } 
  } 
 
  if (board.every(cell = !== null)) { 
    return 'draw'; 
  } 
 
  return null; 
} 
 
io.on('connection', (socket) =
  console.log('Новое подключение:', socket.id); 
 
  socket.on('createRoom', (playerName) =
    const roomId = generateRoomId(); 
 
    const room = { 
      id: roomId, 
      players: [{ id: socket.id, name: playerName, symbol: 'X' }], 
      board: Array(9).fill(null), 
      currentTurn: 'X', 
      status: 'waiting', 
      winner: null 
    }; 
 
    rooms.set(roomId, room); 
    socket.join(roomId); 
 
    console.log('Комната ' + roomId + ' создана'); 
    socket.emit('roomCreated', room); 
  }); 
 
  socket.on('joinRoom', ({ roomId, playerName }) =
    const room = rooms.get(roomId); 
 
    if (!room) { 
      socket.emit('error', 'Комната не найдена'); 
      return; 
    } 
 
    if (room.players.length  { 
      socket.emit('error', 'Комната уже заполнена'); 
      return; 
    } 
 
    room.players.push({ id: socket.id, name: playerName, symbol: 'O' }); 
    room.status = 'playing'; 
    socket.join(roomId); 
 
    io.to(roomId).emit('playerJoined', room); 
  }); 
 
  socket.on('makeMove', ({ roomId, cellIndex }) =
    const room = rooms.get(roomId); 
 
    const player = room.players.find(p = === socket.id); 
 
    if (room.board[cellIndex] !== null) return; 
 
    room.board[cellIndex] = player.symbol; 
    const winner = checkWinner(room.board); 
 
    if (winner) { 
      room.status = 'finished'; 
      room.winner = winner; 
    } else { 
      room.currentTurn = room.currentTurn === 'X' ? 'O' : 'X'; 
    } 
 
    io.to(roomId).emit('gameUpdate', room); 
  }); 
 
  socket.on('resetGame', (roomId) =
    const room = rooms.get(roomId); 
    if (!room) return; 
 
    room.board = Array(9).fill(null); 
    room.currentTurn = 'X'; 
    room.status = 'playing'; 
    room.winner = null; 
 
    io.to(roomId).emit('gameUpdate', room); 
  }); 
 
  socket.on('disconnect', () =
    for (const [roomId, room] of rooms.entries()) { 
      const playerIndex = room.players.findIndex(p = === socket.id); 
      if (playerIndex !== -1) { 
        room.players.splice(playerIndex, 1); 
        if (room.players.length === 0) { 
          rooms.delete(roomId); 
        } else { 
          room.status = 'waiting'; 
          io.to(roomId).emit('playerLeft', room); 
        } 
      } 
    } 
  }); 
}); 
 
server.listen(PORT, () =
  console.log('Сервер запущен на порту ' + PORT); 
}); 
