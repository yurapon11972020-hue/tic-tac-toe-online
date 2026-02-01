let socket; 
let currentRoom = null; 
let playerName = ''; 
let currentPlayerSymbol = ''; 
let isMyTurn = false; 
 
const loginScreen = document.getElementById('loginScreen'); 
const createRoomScreen = document.getElementById('createRoomScreen'); 
const joinRoomScreen = document.getElementById('joinRoomScreen'); 
const gameScreen = document.getElementById('gameScreen'); 
 
const playerNameInput = document.getElementById('playerName'); 
const createRoomBtn = document.getElementById('createRoomBtn'); 
const joinRoomBtn = document.getElementById('joinRoomBtn'); 
const createPlayerName = document.getElementById('createPlayerName'); 
const joinPlayerName = document.getElementById('joinPlayerName'); 
const roomIdDisplay = document.getElementById('roomIdDisplay'); 
const copyRoomIdBtn = document.getElementById('copyRoomIdBtn'); 
const roomIdInput = document.getElementById('roomIdInput'); 
const confirmJoinBtn = document.getElementById('confirmJoinBtn'); 
const joinError = document.getElementById('joinError'); 
const currentRoomId = document.getElementById('currentRoomId'); 
const copyGameRoomIdBtn = document.getElementById('copyGameRoomIdBtn'); 
const gameBoard = document.getElementById('gameBoard'); 
const currentTurnMessage = document.getElementById('currentTurnMessage'); 
const gameResultMessage = document.getElementById('gameResultMessage'); 
const resetGameBtn = document.getElementById('resetGameBtn'); 
const leaveRoomBtn = document.getElementById('leaveRoomBtn'); 
const player1Status = document.getElementById('player1Status'); 
const player2Status = document.getElementById('player2Status'); 
const notification = document.getElementById('notification'); 
 
function init() { 
    socket = io(); 
 
    setupEventListeners(); 
    setupSocketEvents(); 
    createGameBoard(); 
 
    showScreen('loginScreen'); 
} 
 
function setupEventListeners() { 
    createRoomBtn.addEventListener('click', () =
        playerName = playerNameInput.value.trim(); 
        if (!playerName) { 
            showNotification('Введите ваше имя', 'error'); 
            return; 
        } 
 
        createPlayerName.textContent = playerName; 
        showScreen('createRoomScreen'); 
 
        document.getElementById('creatingRoom').classList.remove('hidden'); 
        document.getElementById('roomCreated').classList.add('hidden'); 
 
        socket.emit('createRoom', playerName); 
    }); 
 
    joinRoomBtn.addEventListener('click', () =
        playerName = playerNameInput.value.trim(); 
        if (!playerName) { 
            showNotification('Введите ваше имя', 'error'); 
            return; 
        } 
 
        joinPlayerName.textContent = playerName; 
        showScreen('joinRoomScreen'); 
    }); 
 
    confirmJoinBtn.addEventListener('click', () =
        const roomId = roomIdInput.value.trim().toUpperCase(); 
        if (!roomId) { 
            showError('Введите ID комнаты'); 
            return; 
        } 
 
        joinError.classList.add('hidden'); 
        socket.emit('joinRoom', { roomId, playerName }); 
    }); 
 
    document.getElementById('backToLoginFromCreate').addEventListener('click', () =
        showScreen('loginScreen'); 
        socket.emit('leaveRoom', currentRoom?.id); 
        currentRoom = null; 
    }); 
 
    document.getElementById('backToLoginFromJoin').addEventListener('click', () =
        showScreen('loginScreen'); 
        socket.emit('leaveRoom', currentRoom?.id); 
        currentRoom = null; 
    }); 
 
    copyRoomIdBtn.addEventListener('click', copyRoomId); 
    copyGameRoomIdBtn.addEventListener('click', copyRoomId); 
 
    resetGameBtn.addEventListener('click', () =
        if (currentRoom) { 
            socket.emit('resetGame', currentRoom.id); 
        } 
    }); 
 
    leaveRoomBtn.addEventListener('click', () =
        if (currentRoom) { 
            socket.emit('leaveRoom', currentRoom.id); 
            showScreen('loginScreen'); 
            currentRoom = null; 
        } 
    }); 
} 
 
function setupSocketEvents() { 
    socket.on('roomCreated', (room) =
        currentRoom = room; 
        currentPlayerSymbol = 'X'; 
 
        document.getElementById('creatingRoom').classList.add('hidden'); 
        document.getElementById('roomCreated').classList.remove('hidden'); 
 
        roomIdDisplay.textContent = room.id; 
        showNotification('Комната создана! Поделитесь ID с другом', 'success'); 
    }); 
 
    socket.on('playerJoined', (room) =
        currentRoom = room; 
        updateGameUI(room); 
        showScreen('gameScreen'); 
        showNotification('Второй игрок присоединился!', 'success'); 
    }); 
 
    socket.on('gameUpdate', (room) =
        currentRoom = room; 
        updateGameUI(room); 
    }); 
 
    socket.on('playerLeft', (room) =
        currentRoom = room; 
        updateGameUI(room); 
        if (room.players.length === 1) { 
            showNotification('Второй игрок покинул комнату', 'warning'); 
        } 
    }); 
 
    socket.on('error', (message) =
        if (document.getElementById('joinRoomScreen').classList.contains('active')) { 
            showError(message); 
        } else { 
            showNotification(message, 'error'); 
        } 
    }); 
} 
 
function showScreen(screenId) { 
    [loginScreen, createRoomScreen, joinRoomScreen, gameScreen].forEach(screen =
        screen.classList.remove('active'); 
    }); 
    document.getElementById(screenId).classList.add('active'); 
} 
 
function createGameBoard() { 
    gameBoard.innerHTML = ''; 
        const cell = document.createElement('div'); 
        cell.className = 'cell'; 
        cell.dataset.index = i; 
        cell.addEventListener('click', () =
        gameBoard.appendChild(cell); 
    } 
} 
 
function makeMove(cellIndex) { 
    if (!isMyTurn) { 
        showNotification('Сейчас не ваш ход!', 'warning'); 
        return; 
    } 
    socket.emit('makeMove', { roomId: currentRoom.id, cellIndex }); 
} 
 
function updateGameUI(room) { 
    currentRoomId.textContent = room.id; 
 
    const player1 = room.players.find(p = === 'X'); 
    const player2 = room.players.find(p = === 'O'); 
 
    if (player1) { 
        document.querySelector('.player1 .player-name').textContent = player1.name; 
        player1Status.textContent = player1.id === socket.id ? '(Вы)' : ''; 
    } 
 
    if (player2) { 
        document.querySelector('.player2 .player-name').textContent = player2.name; 
        player2Status.textContent = player2.id === socket.id ? '(Вы)' : ''; 
    } else { 
        document.querySelector('.player2 .player-name').textContent = 'Ожидание...'; 
        player2Status.textContent = ''; 
    } 
 
    updateBoard(room.board); 
    updateGameStatus(room); 
 
    const currentPlayer = room.players.find(p = === room.currentTurn); 
 
    document.querySelectorAll('.player').forEach(p =
        const playerElement = currentPlayer.symbol === 'X' ? 
            document.querySelector('.player1') : 
            document.querySelector('.player2'); 
        playerElement.classList.add('active'); 
    } 
} 
 
function updateBoard(board) { 
    const cells = document.querySelectorAll('.cell'); 
    cells.forEach((cell, index) =
        cell.textContent = ''; 
        cell.classList.remove('x', 'o', 'win'); 
        if (board[index]) { 
            cell.textContent = board[index]; 
            cell.classList.add(board[index].toLowerCase()); 
        } 
    }); 
 
        highlightWinningCombination(board); 
    } 
} 
 
function highlightWinningCombination(board) { 
    const winPatterns = [ 
        [0,1,2], [3,4,5], [6,7,8], 
        [0,3,6], [1,4,7], [2,5,8], 
        [0,4,8], [2,4,6] 
    ]; 
 
    for (let pattern of winPatterns) { 
        const [a,b,c] = pattern; 
            const cells = document.querySelectorAll('.cell'); 
            cells[a].classList.add('win'); 
            cells[b].classList.add('win'); 
            cells[c].classList.add('win'); 
            break; 
        } 
    } 
} 
 
function updateGameStatus(room) { 
    gameResultMessage.classList.add('hidden'); 
 
    if (room.status === 'waiting') { 
        currentTurnMessage.textContent = 'Ожидание второго игрока...'; 
    } else if (room.status === 'playing') { 
        const currentPlayer = room.players.find(p = === room.currentTurn); 
        if (currentPlayer) { 
            const playerName = currentPlayer.id === socket.id ? 'Ваш' : currentPlayer.name; 
            currentTurnMessage.textContent = playerName + ' ход (' + room.currentTurn + ')'; 
        } 
    } else if (room.status === 'finished') { 
        if (room.winner === 'draw') { 
            currentTurnMessage.textContent = 'Ничья!'; 
            gameResultMessage.textContent = 'Игра окончилась вничью!'; 
            gameResultMessage.classList.remove('hidden'); 
        } else { 
            const winner = room.players.find(p = === room.winner); 
            if (winner) { 
                const winnerName = winner.id === socket.id ? 'Вы' : winner.name; 
                currentTurnMessage.textContent = winnerName + ' победил(а)!'; 
                gameResultMessage.textContent = 'Победитель: ' + winnerName; 
                gameResultMessage.classList.remove('hidden'); 
            } 
        } 
    } 
} 
 
function copyRoomId() { 
    navigator.clipboard.writeText(roomId) 
        .then(() = скопирован!', 'success')) 
        .catch(() = удалось скопировать', 'error')); 
} 
 
function showError(message) { 
    joinError.querySelector('p').textContent = message; 
    joinError.classList.remove('hidden'); 
} 
 
function showNotification(message, type = 'info') { 
    const notification = document.getElementById('notification'); 
    notification.querySelector('p').textContent = message; 
 
    if (type === 'error') notification.style.background = '#e74c3c'; 
    else if (type === 'success') notification.style.background = '#27ae60'; 
    else if (type === 'warning') notification.style.background = '#f39c12'; 
    else notification.style.background = '#2c3e50'; 
 
    notification.classList.add('show'); 
    setTimeout(() =, 3000); 
} 
 
document.addEventListener('DOMContentLoaded', init); 
