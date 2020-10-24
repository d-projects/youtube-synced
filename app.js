const { render } = require('ejs');
const express = require('express');
const bodyParser = require('body-parser');
const parse = require('url-parse');
const http = require('http');
const app = express();
const session = require('express-session');
const socketio = require('socket.io');
const server = http.createServer(app);
const mongoose = require('mongoose');
const Room = require('./models/room.js');
const config = require('./config.js');
const io = socketio(server);
const port = process.env.PORT || 3000;

app.use(session({
    secret: 'random string',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
}));


app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

const dbURI = `mongodb+srv://${config.db_user}:${config.db_password}@${config.db_cluster}.ffgxc.mongodb.net/${config.db_name}`;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
        server.listen(port);
        console.log('connected');
    })
    .catch(err => {
        console.log(err);
    });



let count = 0;

/**
 * Handles the websocket connections
 */

io.on('connection', socket => {

    console.log('Webscoket connection working!');
    const user = "user";

    socket.join(session.room);
    socket.emit('join', {
        joinMessage: "Welcome",
        master: (session.isMaster) ? true : false
    });
    socket.broadcast.to(session.room).emit('join', {
        joinMessage: `${user} has joined the chat`
    });

    socket.on('updateChat', message => {
        socket.broadcast.to(session.room).emit('chatUpdated', message);
    });

    socket.on('sendTime', ({time, state, to}) => {
        console.log(to);
        io.sockets.connected[to].emit('setTime', {time, state});
    });

    socket.on('sync', () => {
        if (session.isMaster){
            Room.findOne({room: session.room})
            .then( result => {
                result.masterSocket = socket.id;
                result.save()
                .then( res => {
                    console.log('yess')
                })
                .catch(err => {
                    console.log(err);
                })
            })
            .catch( err => {
                console.log(err);
            })
            session.masterSocket = io.sockets.connected[socket.id];
        } else {
            Room.findOne({room: session.room})
            .then( result => {
                session.masterSocket = io.sockets.connected[result.masterSocket];
            })
            .catch( err => {
                console.log(err);
            })
        }
        if (!session.isMaster) {
            session.masterSocket.emit('getTime', {to: socket.id});
        }
    });

    socket.on('disconnect', () => {

        session.embedID = null;
        socket.broadcast.to(session.room).emit('join', `${user} has left the chat`)
        session.open = false;
        if (session.isMaster){
            Room.deleteOne({room: session.room})
            .then( result => {
                console.log('Yay')
            })
            .catch (err => {
                console.log(err);
            })
        }
        
    });

});

/**
 * Used by Fetch API to get youtube video ID
 */

app.get('/videoID', (req, res) => {
    res.send(JSON.stringify(session.embedID));
})

app.get('/noAccess', (req, res) => {
    render('noAccess', {title: 'No Access'});
})

/**
 * Home Page
 */

app.get('/', (req, res) => {
    res.render('index', {title: 'Home'});
});

/**
 * Synced Video Page
 */

app.post('/watch', (req, res) => {
    const url = parse(req.body.url, true);   
    session.embedID = url.query.v;
    const roomID = Math.floor(Math.random() * 100000);
    session.room = roomID;
    const room = new Room({room: roomID, videoID: session.embedID});
    session.isMaster = true;
    room.save()
    .then( result => {
        console.log('saved');
    })
    .catch( err => {
        console.log(err);
    })
    res.render('watch', {title: 'Watch', room: session.room, master: true});
});

app.post('/join', (req, res) => {
    const room = req.body.room;
    session.room = room;
    Room.findOne({room: room})
    .then( result => {
        session.embedID = result.videoID;
        console.log('hereee')
    })
    .catch( err => {
        console.log(err);
    })
    session.isMaster = false;
    res.render('watch', {title: 'Watch', room: session.room, master: false});
});

app.use( (req, res) => {
    res.status(404).render('404', {title: 'Page Not Found'});
});




