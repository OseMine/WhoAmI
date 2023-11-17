const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const rooms = {};

function generateRoomID(pin) {
    return `${pin}`;
}

app.get('/', (req, res) => {
    res.render('index');
});

app.post('/create-room', (req, res) => {
    const pin = generatePIN();
    const roomName = `Room ${pin}`;
    const roomID = generateRoomID(pin);

    rooms[roomID] = { id: roomID, name: roomName, players: [] };
    res.redirect(`/room/${roomID}`);
});

app.post('/join-room', (req, res) => {
    const roomPIN = req.body.roomPIN;
    const roomID = generateRoomID(roomPIN);

    const room = rooms[roomID];
    if (room) {
        res.redirect(`/room/${roomID}`);
    } else {
        res.redirect('/');
    }
});


app.get('/room/:roomID', (req, res) => {
    const roomID = req.params.roomID;
    const room = rooms[roomID];

    if (room) {
        // Hier wird die Variable 'pin' definiert und an die Ansicht übergeben
        const pin = roomID;
        res.render('room', { room, pin });
    } else {
        res.redirect('/');
    }
});


io.on('connection', (socket) => {
    socket.on('join-room', (data) => {
        const { roomID, playerName } = data;
        const room = rooms[roomID];
        if (room) {
            room.players.push(playerName);
            io.to(roomID).emit('update-players', room.players);
            socket.join(roomID);
        }
    });
});

function generatePIN() {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

// Füge hier deine bestehende Server-Listen-Funktion hinzu, wenn du eine hast
server.listen(3000, () => {
    console.log('Server is running on port 3000');
});
