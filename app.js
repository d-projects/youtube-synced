const { render } = require('ejs');
const express = require('express');
const bodyParser = require('body-parser');
const parse = require('url-parse');
const http = require('http');
const app = express();
const session = require('express-session');
const socketio = require('socket.io');
const server = http.createServer(app);
const io = socketio(server);
const port = process.env.PORT || 3000;

app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));


app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

let count = 0;

io.on('connection', socket => {
    console.log('Webscoket connection working');
    const user = "user";
    if (!session.users){
        session.users = 0;
    }
    session.users++;
    socket.emit('join', {
        joinMessage: "Welcome",
        videoID: session.embedID
    });
    socket.broadcast.emit('join', {
        joinMessage: `${user} has joined the chat`
    });
    if (Object.keys(io.sockets.connected).length == 1){
        session.master = Object.keys(io.sockets.connected)[0];
    };

    socket.on('update', message => {
        io.emit('chatUpdated', message);
    });

    socket.on('play', (time) => {
        io.sockets.connected[session.master].emit('getTime');
        socket.on('sendTime', (time) => {
            io.emit('updatePlay', time);
        })
        
    });

    socket.on('pause', () => {
        io.sockets.connected[session.master].emit('getTime');
        socket.on('sendTime', (time) => {
            io.emit('updatePause', time);
        })
    });

    // socket.on('sync', () => {
    //     io.sockets.connected[session.master].emit('getTime');

    // });

    socket.on('disconnect', () => {
        session.users--;
        socket.broadcast.emit('join', `${user} has left the chat`)
    });

});

server.listen(port, () => {
    console.log('working');
});

app.get('/test', (req, res) => {
    res.render('test');
});

app.get('/', (req, res) => {
    res.render('index');
});

app.get('/videoID', (req, res) => {
    res.send(JSON.stringify(session.embedID));
})

app.post('/watch', (req, res) => {
    if (!session.embedID){
        const url = parse(req.body.url, true);
        session.embedID = url.query.v;
    } 
    res.render('watch');
});




