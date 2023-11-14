/*
 Dieser Code ist eine Node.js-Anwendung, die eine Server-Client-Verbindung mit Socket.IO verwendet, um eine interaktive Zeichenanwendung zu implementieren.
Der Server verwendet Express.js, um den HTTP-Server zu erstellen, und Socket.IO, um die Echtzeitkommunikation mit den Clients zu ermöglichen.

Der Code enthält verschiedene Funktionen und Event-Handler, um die Funktionalität der Anwendung zu steuern. Hier sind einige der wichtigsten Teile des Codes:

- Es gibt Funktionen zur Initialisierung der Canvas-Daten, zum Aktualisieren der Online-Benutzeranzahl, zum Speichern der Canvas-Daten in eine Datei und zur Authentifizierung von Clients anhand eines Tokens.
- Es gibt Event-Handler für die Socket.IO-Verbindung, die verschiedene Aktionen wie das Malen eines Pixels, das Senden von Chat-Nachrichten und das Laden des Chat-Verlaufs behandeln.
- Es gibt Funktionen zur Aktualisierung der Benutzerpixelanzahl in der Datenbank und zur Aktualisierung der Bestenliste.
- Es gibt Funktionen zur Berechnung der verbleibenden Zeit für Benutzer und IP-Adressen, um Rate-Limits zu implementieren.
- Es gibt Funktionen zur Datei-E/A, um Ereignisse zu protokollieren, Chat-Nachrichten zu speichern und den Chat-Verlauf zu laden.
.*/

const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const fs = require('fs');
const mysql = require('mysql');
const cookieParser = require('cookie-parser');
const cookie = require('cookie');
const crypto = require('crypto');

const app = express();

const server = http.createServer(app);

const io = socketIO(server);

const ipRateLimitMap = new Map();
const userRateLimitMap = new Map();

const MAX_MAP_SIZE = 10000;

const userLastChatTime = new Map();
const chatCooldown = 10000;

const newCanvasWidth = 1000;
const newCanvasHeight = 1000;

let saveTimeout;
let userPixelCount = {};
let canvasData = [];

const onlineUsers = new Set();

const chatFilePath = 'chatHistory.txt';

const toxicWords = ['badword1', 'badword2', 'badword3']; // Fügen Sie weitere toxische Wörter zu dieser Liste hinzu
const maxMessageLength = 300;

app.use(express.static(path.join(__dirname, 'game')));
app.use(cookieParser());

const dbConfig = {
  host: 'localhost',
  user: 'root',
  database: 'user_auth',
};

//---------------------------------------------------------------------------------------
//--------------------------- INITIALISIERUNG -------------------------------------------
//---------------------------------------------------------------------------------------

// Funktion zum Initialisieren der Canvas-Daten
function initializeCanvasData() {
  if (fs.existsSync('savedpixel.txt')) {
    fs.readFile('savedpixel.txt', 'utf8', (err, fileData) => {
      if (err) {
        console.error('Fehler beim Lesen der Daten aus der Datei:', err.message);
        logEvent('Fehler beim Lesen der Daten aus savedpixel.txt');
        canvasData = createBlankCanvas();
      } else {
        if (fileData.trim().length > 0) {
          try {
            canvasData = JSON.parse(fileData);
            logEvent('Canvas-Daten aus savedpixel.txt geladen');
          } catch (error) {
            console.error('Fehler beim Parsen der Daten aus der Datei:', error.message);
            logEvent('Fehler beim Parsen der Daten aus savedpixel.txt');
            canvasData = createBlankCanvas();
          }
        } else {
          canvasData = createBlankCanvas();
          logEvent('Canvas-Daten mit einer leeren Leinwand initialisiert');
        }
      }
    });
  } else {
    canvasData = createBlankCanvas();
    logEvent('Canvas-Daten mit einer leeren Leinwand initialisiert');
  }
}

// Funktion zum Aktualisieren der Online-Benutzeranzahl
function updateOnlineUserCount() {
  const onlineUserCount = onlineUsers.size;
  io.emit('onlineUserCount', onlineUserCount);
}

// Funktion zum Speichern der Canvas-Daten in eine Datei
async function saveCanvasDataToFile() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    const dataToSave = JSON.stringify(canvasData);
    try {
      await fs.promises.writeFile('savedpixel.txt', dataToSave, 'utf8');
      logEvent('Canvas-Daten in savedpixel.txt gespeichert');
    } catch (error) {
      console.error('Fehler beim Schreiben der Daten in die Datei:', error.message);
      logEvent('Fehler beim Schreiben der Daten in savedpixel.txt');
    }
  }, 1000);
}

//---------------------------------------------------------------------------------------
//--------------------------- SOCKET.IO-VERBINDUNGSHANDHABUNG ---------------------------
//---------------------------------------------------------------------------------------

// Event-Handler für die Socket.IO-Verbindung
io.on('connection', (socket) => {

  let clientIp = socket.handshake.headers['x-real-ip'] || socket.handshake.address;
  let hashedIp = hashIpAddress(clientIp); // Hash der IP-Adresse
  let clientUsername = "null";

  // Funktion zum Hashing / Verschlüsseln der IP-Adresse
  function hashIpAddress(ip) {
    const secret = 'x#7Tq9$RfPm2GvZ@6yH*3sKp';
    const hash = crypto.createHmac('sha256', secret)
        .update(ip)
        .digest('hex');
    return hash;
  }

  console.log( `Ein Benutzer ist verbunden von IP: ${hashedIp}` ); //IP ist gehasht / verschlüsselt
  logEvent( `Ein Benutzer ist verbunden von IP: ${hashedIp}` ); //IP ist gehasht / verschlüsselt

  // Überprüfen, ob der Client ein Token-Cookie hat
  let clientToken;
  if (socket.handshake.headers.cookie) {
    const cookies = cookie.parse(socket.handshake.headers.cookie);
    clientToken = cookies.token;
    if (clientToken) {
      authenticateClient(clientToken);
    }
  } else {
    socket.emit('relogin');
  }

  // Funktion zum Authentifizieren des Clients anhand des Tokens
  function authenticateClient(token) {
    const query = 'SELECT username FROM users WHERE token = ?';
    connection.query(query, [token], (err, result) => {
      if (err) {
        console.error('Fehler bei der Authentifizierung des Clients:', err.message);
        logEvent(`Fehler bei der Authentifizierung des Clients mit Token: ${token}`);
      } else {
        if (result.length > 0) {
          clientUsername = result[0].username;
          console.log(`Client authentifiziert als Benutzername: ${clientUsername} IP: ${hashedIp}`); //IP ist gehashed
          logEvent(`Client authentifiziert als Benutzername: ${clientUsername} IP: ${hashedIp}`); //IP ist gehashed
          onlineUsers.add(clientUsername);
          updateOnlineUserCount();
        }
      }
    });
  }

  //---------------------------------------------------------------------------------------
//--------------------------- SOCKET.IO-EVENT-HANDHABUNG --------------------------------
//---------------------------------------------------------------------------------------

  const lastPaintTime = calculateIpRemainingTime(hashedIp, Date.now());
  socket.emit('time', { lastPaintTime });

  socket.emit('initialCanvasData', canvasData);

  socket.emit('initialLeaderboard', Object.entries(userPixelCount).map(([username, pixelCount]) => ({ username, pixelCount })));

  // Event-Handler für das Abrufen des Besitzers eines Pixels
  socket.on('getPixelOwner', (x, y) => {
    if (x >= 0 && x < newCanvasWidth && y >= 0 && y < newCanvasHeight) {
      const pixelInfo = canvasData[y][x];
      const ownerUsername = pixelInfo.user;
      socket.emit('pixelOwnerResponse', { x, y, ownerUsername });
    }
  });

  // Event-Handler für Chat-Nachrichten
  socket.on('chatMessage', (message) => {
    if (message.length <= maxMessageLength) {
      const currentTime = Date.now();
      const lastChatTime = userLastChatTime.get(clientUsername) || 0;

      if (currentTime - lastChatTime >= chatCooldown && !containsToxicWords(message) && !containsLink(message)) {
        userLastChatTime.set(clientUsername, currentTime);
        saveChatMessageToTxtFile(clientUsername, message);
        io.emit('chatMessage', { sender: clientUsername, message });
        socket.emit('chatCooldown', chatCooldown);
      } else {
        if (containsToxicWords(message) || containsLink(message)) {
          socket.emit('chatMessage', { sender: clientUsername, message });
          socket.emit('chatCooldown', chatCooldown);
        } else {
          socket.emit('chatCooldown', chatCooldown - (currentTime - lastChatTime));
        }
      }
    } else {
      socket.emit('chatMessage', { sender: clientUsername, message: 'Ihre Nachricht überschreitet das Zeichenlimit.' });
    }
  });

  // Funktion zum Überprüfen, ob eine Nachricht toxische Wörter enthält
  function containsToxicWords(message) {
    const lowerCaseMessage = message.toLowerCase();
    return toxicWords.some((word) => lowerCaseMessage.includes(word));
  }

  // Funktion zum Überprüfen, ob eine Nachricht einen Link enthält
  function containsLink(message) {
    const linkPattern = /(http(s)?:\/\/[^\s]+)/;
    return linkPattern.test(message);
  }

  // Event-Handler zum Laden des Chat-Verlaufs
  socket.on('loadChatHistory', () => {
    loadLastChatMessagesFromTxtFile(10, (chatHistory) => {
      socket.emit('chatHistory', chatHistory);
    });
  });

  // Event-Handler zum Malen eines Pixels
  socket.on('paintPixel', ({ x, y, color }) => {
    const currentTime = Date.now();
    const ipRemainingTime = calculateIpRemainingTime(hashedIp, currentTime);
    const userRemainingTime = calculateRemainingTime(clientUsername, currentTime);

    let remainingTimeInSeconds;

    if (userRemainingTime > 0) {
      remainingTimeInSeconds = userRemainingTime;
    } else {
      remainingTimeInSeconds = ipRemainingTime;
    }

    if (remainingTimeInSeconds > 0) {
      console.log( `Rate-Limit erreicht für Client: ${hashedIp}` );
      logEvent( `Rate-Limit erreicht für Client: ${hashedIp}` );
      socket.emit('rateLimitReached');
      return;
    }

    updateRateLimitMap(clientUsername, currentTime);
    updateIpRateLimitMap(hashedIp, currentTime);

    if (x >= 0 && x < newCanvasWidth && y >= 0 && y < newCanvasHeight) {
      canvasData[y][x] = { color, user: clientUsername };
      io.emit('updateCanvasData', { x, y, color });
      logEvent( `Pixel-Koordinaten: (${x}, ${y}) von ${clientUsername}` );

      if (clientUsername) {
        updateUserPixelCount(clientUsername);
        updateLeaderboard();
      }
    } else {
      logEvent( `Ungültige Pixel-Koordinaten: (${x}, ${y}) von ${clientUsername}` );
    }
  });

  // Event-Handler für das Trennen der Verbindung
  socket.on('disconnect', () => {
    logEvent( `Ein Benutzer hat die Verbindung getrennt von IP: ${hashedIp}` );
    console.log( `Ein Benutzer hat die Verbindung getrennt von IP: ${hashedIp}` );
    onlineUsers.delete(clientUsername);
    updateOnlineUserCount();
  });
});

//---------------------------------------------------------------------------------------
//--------------------------- DATENBANKVERBINDUNG ---------------------------------------
//---------------------------------------------------------------------------------------

const connection = mysql.createConnection(dbConfig);

connection.connect((err) => {
  if (err) {
    console.error('Fehler beim Verbinden mit der Datenbank:', err.message);
    logEvent('Fehler beim Verbinden mit der Datenbank:', err.message);
    return;
  }
  console.log('Mit der Datenbank verbunden');
  logEvent('Mit der Datenbank verbunden');
});

// Funktion zum Aktualisieren der Benutzerpixelanzahl in der Datenbank
function updateUserPixelCount(clientUsername) {
  if (!userPixelCount.hasOwnProperty(clientUsername)) {
    userPixelCount[clientUsername] = 1;
  } else {
    userPixelCount[clientUsername]++;
  }

  const query = 'UPDATE users SET pixelCount = ? WHERE username = ?';
  connection.query(query, [userPixelCount[clientUsername], clientUsername], (err, result) => {
    if (err) {
      console.error('Fehler beim Aktualisieren der Anzahl der Benutzerpixel in der Datenbank:', err.message);
      logEvent( `Fehler beim Aktualisieren der Anzahl der Benutzerpixel in der Datenbank für Benutzer: ${clientUsername}` );
    } else {
      logEvent( `Anzahl der Benutzerpixel in der Datenbank aktualisiert für Benutzer: ${clientUsername}` );
    }
  });
}

// Funktion zum Aktualisieren der Bestenliste
function updateLeaderboard() {
  const leaderboardData = Object.entries(userPixelCount).map(([username, pixelCount]) => ({ username, pixelCount }));
  leaderboardData.sort((a, b) => b.pixelCount - a.pixelCount);
  io.emit('updateLeaderboard', leaderboardData);
}

// Abfrage zur Initialisierung der Benutzerpixelanzahl aus der Datenbank
const query1 = 'SELECT username, pixelCount FROM users';
connection.query(query1, (err, results) => {
  if (err) {
    console.error('Fehler beim Abrufen der Anzahl der Benutzerpixel aus der Datenbank:', err.message);
    logEvent('Fehler beim Abrufen der Anzahl der Benutzerpixel aus der Datenbank:', err.message);
  } else {
    userPixelCount = {};
    results.forEach((row) => {
      userPixelCount[row.username] = row.pixelCount;
    });
    logEvent('Benutzerpixelanzahl aus der Datenbank geladen');
    updateLeaderboard();
  }
})

//---------------------------------------------------------------------------------------
//--------------------------- HILFSFUNKTIONEN -------------------------------------------
//---------------------------------------------------------------------------------------

// Funktion zum Berechnen der verbleibenden Zeit für einen Benutzer
function calculateRemainingTime(client, currentTime) {
  if (userRateLimitMap.has(client)) {
    const { requestCount, lastDrawingTime } = userRateLimitMap.get(client);
    const elapsedTime = currentTime - lastDrawingTime;
    const remainingTimeInSeconds = Math.max(0, 59 - Math.floor(elapsedTime / 1000));
    return remainingTimeInSeconds;
  } else {
    return 0;
  }
}

// Funktion zum Berechnen der verbleibenden Zeit für eine IP-Adresse
function calculateIpRemainingTime(hashedIp, currentTime) {
  if (ipRateLimitMap.has(hashedIp)) {
    const { requestCount, lastDrawingTime } = ipRateLimitMap.get(hashedIp);
    const elapsedTime = currentTime - lastDrawingTime;
    const remainingTimeInSeconds = Math.max(0, 59 - Math.floor(elapsedTime / 1000));
    return remainingTimeInSeconds;
  } else {
    return 0;
  }
}

// Funktion zum Aktualisieren der IP-Rate-Limit-Map
function updateIpRateLimitMap(hashedIp, currentTime) {
  if (ipRateLimitMap.size >= MAX_MAP_SIZE) {
    const oldestEntry = ipRateLimitMap.entries().next().value[0];
    ipRateLimitMap.delete(oldestEntry);
  }
  if (ipRateLimitMap.has(hashedIp)) {
    const { requestCount, lastDrawingTime } = ipRateLimitMap.get(hashedIp);
    const elapsedTime = currentTime - lastDrawingTime;
    if (elapsedTime >= 60000) {
      ipRateLimitMap.set(hashedIp, { requestCount: 1, lastDrawingTime: currentTime });
    } else {
      ipRateLimitMap.set(hashedIp, { requestCount: requestCount + 1, lastDrawingTime: lastDrawingTime });
    }
  } else {
    ipRateLimitMap.set(hashedIp, { requestCount: 1, lastDrawingTime: currentTime });
  }
}

// Funktion zum Aktualisieren der Rate-Limit-Map für einen Benutzer
function updateRateLimitMap(client, currentTime) {
  if (userRateLimitMap.size >= MAX_MAP_SIZE) {
    const oldestEntry = userRateLimitMap.entries().next().value[0];
    userRateLimitMap.delete(oldestEntry);
  }
  if (userRateLimitMap.has(client)) {
    const { requestCount, lastDrawingTime } = userRateLimitMap.get(client);
    const elapsedTime = currentTime - lastDrawingTime;
    if (elapsedTime >= 60000) {
      userRateLimitMap.set(client, { requestCount: 1, lastDrawingTime: currentTime });
    } else {
      userRateLimitMap.set(client, { requestCount: requestCount + 1, lastDrawingTime: lastDrawingTime });
    }
  } else {
    userRateLimitMap.set(client, { requestCount: 1, lastDrawingTime: currentTime });
  }
}

// Funktion zum Erstellen einer leeren Leinwand
function createBlankCanvas() {
  const blankCanvas = [];
  for (let i = 0; i < newCanvasHeight; i++) {
    blankCanvas[i] = new Array(newCanvasWidth).fill({ color: 'rgb(255,255,255)', user: null });
  }
  return blankCanvas;
}

//---------------------------------------------------------------------------------------
//--------------------------- DATEI-E/A-Funktionen --------------------------------------
//---------------------------------------------------------------------------------------

// Funktion zum Protokollieren von Ereignissen
async function logEvent(message) {
  const timestamp = new Date().toISOString();
  const logMessage =  `[${timestamp}] ${message}\n` ;
  try {
    await fs.promises.appendFile('logs.txt', logMessage, 'utf8');
  } catch (error) {
    console.error('Fehler beim Schreiben in die Datei:', error.message);
  }
}

// Funktion zum Speichern einer Chat-Nachricht in eine Textdatei
function saveChatMessageToTxtFile(sender, message) {
  const timestamp = new Date().toISOString();
  const chatMessage =  `[${timestamp}] ${sender}: ${message}\n` ;

  fs.appendFile(chatFilePath, chatMessage, 'utf8', (err) => {
    if (err) {
      console.error('Fehler beim Speichern der Chat-Nachricht in die Datei:', err.message);
    }
  });
}

// Funktion zum Laden der letzten Chat-Nachrichten aus einer Textdatei
function loadLastChatMessagesFromTxtFile(numMessages, callback) {
  fs.readFile(chatFilePath, 'utf8', (err, fileData) => {
    if (err) {
      console.error('Fehler beim Lesen des Chat-Verlaufs aus der Datei:', err.message);
      callback([]);
    } else {
      const chatLines = fileData.trim().split('\n');
      const startIndex = Math.max(chatLines.length - numMessages, 0);
      const lastMessages = chatLines
          .slice(startIndex)
          .map((line) => {
            const match = line.match(/\[(.*?)\] (.*?): (.*)/);
            if (match) {
              const [timestamp, sender, message] = match.slice(1);
              return { timestamp, sender, message };
            } else {
              return null;
            }
          })
          .filter((chat) => chat && chat.timestamp && chat.sender && chat.message);

      callback(lastMessages);
    }
  });
}

//---------------------------------------------------------------------------------------
//--------------------------- SERVERKONFIGURATION ---------------------------------------
//---------------------------------------------------------------------------------------

const port = 3000;
server.listen(port, () => {
  console.log( `Server läuft unter http://localhost:${port}` );
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

//---------------------------------------------------------------------------------------
//--------------------------- SOCKET.IO-EVENT-HANDHABUNG --------------------------------
//---------------------------------------------------------------------------------------

// Initialisierung der Canvas-Daten
initializeCanvasData();

// Periodisches Speichern der Canvas-Daten in eine Datei
setInterval(saveCanvasDataToFile, 60000);