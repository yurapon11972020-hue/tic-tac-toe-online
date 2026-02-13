// ===== Firebase Imports (через CDN для GitHub Pages) =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getDatabase, ref, set, onValue, update, get, remove } 
from "https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";

// ===== ТВОЙ Firebase Config =====
const firebaseConfig = {
  apiKey: "AIzaSyDV48oZfNQ0nwbpT8Eg5SoIvHZcZTQPkYQ",
  authDomain: "tic-tac-toe-online-acbe6.firebaseapp.com",
  databaseURL: "https://tic-tac-toe-online-acbe6-default-rtdb.firebaseio.com",
  projectId: "tic-tac-toe-online-acbe6",
  storageBucket: "tic-tac-toe-online-acbe6.firebasestorage.app",
  messagingSenderId: "596559246049",
  appId: "1:596559246049:web:cd09b9701de59aeea3fda0"
};

// ===== Инициализация =====
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// ===== Переменные =====
let currentRoom = null;
let playerSymbol = null;
let playerId = Math.random().toString(36).substr(2, 9);

const roomListDiv = document.getElementById("roomList");
const boardDiv = document.getElementById("board");
const statusText = document.getElementById("status");
const scoreText = document.getElementById("score");

const rooms = ["room1", "room2", "room3"];

// ===== Создание кнопок комнат =====
rooms.forEach(room => {
  const btn = document.createElement("button");
  btn.textContent = room;
  btn.onclick = () => joinRoom(room);
  roomListDiv.appendChild(btn);
});

// ===== Подключение к комнате =====
function joinRoom(room) {
  currentRoom = room;
  const roomRef = ref(db, "rooms/" + room);

  get(roomRef).then(snapshot => {

    if (!snapshot.exists()) {
      // Если комнаты нет — создаём
      set(roomRef, {
        players: { [playerId]: "X" },
        board: Array(9).fill(""),
        turn: "X",
        score: { X: 0, O: 0 }
      });
      playerSymbol = "X";

    } else {
      const data = snapshot.val();
      const players = data.players || {};

      if (Object.keys(players).length < 2) {
        playerSymbol = "O";
        update(roomRef, {
          [`players/${playerId}`]: "O"
        });
      } else {
        alert("Комната уже занята");
        return;
      }
    }

    document.getElementById("rooms").classList.add("hidden");
    document.getElementById("game").classList.remove("hidden");

    listenGame();
  });
}

// ===== Слушаем изменения =====
function listenGame() {
  const roomRef = ref(db, "rooms/" + currentRoom);

  onValue(roomRef, snapshot => {
    const data = snapshot.val();
    if (!data) return;

    drawBoard(data.board);
    scoreText.textContent = `X: ${data.score.X} | O: ${data.score.O}`;

    if (Object.keys(data.players).length < 2) {
      statusText.textContent = "Ожидание второго игрока...";
    } else {
      statusText.textContent =
        data.turn === playerSymbol ? "Твой ход" : "Ход соперника";
    }
  });
}

// ===== Отрисовка поля =====
function drawBoard(board) {
  boardDiv.innerHTML = "";

  board.forEach((cell, index) => {
    const div = document.createElement("div");
    div.classList.add("cell");
    div.textContent = cell;
    div.onclick = () => makeMove(index);
    boardDiv.appendChild(div);
  });
}

// ===== Сделать ход =====
function makeMove(index) {
  const roomRef = ref(db, "rooms/" + currentRoom);

  get(roomRef).then(snapshot => {
    const data = snapshot.val();

    if (!data) return;
    if (data.turn !== playerSymbol) return;
    if (data.board[index] !== "") return;

    data.board[index] = playerSymbol;
    data.turn = playerSymbol === "X" ? "O" : "X";

    const winner = checkWinner(data.board);

    if (winner) {
      data.score[winner]++;
      data.board = Array(9).fill("");
      data.turn = "X";

      if (data.score[winner] >= 3) {
        alert("Победил " + winner + "!");
        data.score = { X: 0, O: 0 };
      }
    }

    update(roomRef, data);
  });
}

// ===== Проверка победителя =====
function checkWinner(board) {
  const combos = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];

  for (let combo of combos) {
    const [a,b,c] = combo;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }

  return null;
}

// ===== Выйти из комнаты =====
window.leaveRoom = function() {
  const roomRef = ref(db, "rooms/" + currentRoom + "/players/" + playerId);
  remove(roomRef);
  location.reload();
};