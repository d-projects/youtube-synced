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
const io = socketio(server);
const port = process.env.PORT || 3000;
const config = require('./settings/config.js');




app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));

const config = {
    db_user: 'dulhan',
    db_password: 'cbtjTNU626tSBkGV',
    db_cluster: 'blogapp',
    db_name: 'youtube-party-db',
}

const dbURI = `mongodb+srv://${config.db_user}:${config.db_password}@${config.db_cluster}.ffgxc.mongodb.net/${config.db_name}`;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(result => {
        app.listen(port);
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

    console.log('Webscoket connection working');
    const user = "user";

    if (!session.master){
        //session.users = 0;
        session.master = socket;
    }
    //session.users += 1;
    // console.log(session.users)
    // console.log(session.embedID);
    console.log(session.room);
    socket.join(session.room);
    socket.emit('join', {
        joinMessage: "Welcome",
        videoID: session.embedID,
        master: (session.master == socket) ? true : false
    });
    socket.broadcast.to(session.room).emit('join', {
        joinMessage: `${user} has joined the chat`
    });

    socket.on('updateChat', message => {
        socket.broadcast.to(session.room).emit('chatUpdated', message);
    });

    socket.on('sendTime', (info) => {
        session.temp.emit('setTime', info);
        session.temp = null;
    });

    socket.on('sync', () => {
        if (session.master != socket) {
            session.master.emit('getTime');
            session.temp = socket;
        }
    });

    socket.on('disconnect', () => {

        session.embedID = null;
        socket.broadcast.emit('join', `${user} has left the chat`)
        session.open = false;
        
    });

});

server.listen(port, () => {
    console.log('working');
});

// app.use( (req, res, next) => ){
//     if (session.open) {}
// }

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
    if (session.embedID == undefined || session.embedID == null){      
        session.embedID = url.query.v;
    }
    const room = Math.floor(Math.random() * 100000);
    session.room = room;
    res.render('watch', {title: 'Watch', room: room});
});

app.post('/join', (req, res) => {
    const room = req.body.room;
    session.room = room;
    res.render('watch', {title: 'Watch', room: room});
});

app.use( (req, res) => {
    res.status(404).render('404', {title: 'Page Not Found'});
});




