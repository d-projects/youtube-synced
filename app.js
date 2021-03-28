const { render } = require('ejs');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const Room = require('./models/room.js');
const socketio = require('socket.io');
const http = require('http');
const server = http.createServer(app);
const ios = require('socket.io-express-session');
require('dotenv').config();
const port = process.env.PORT || 3000;

/**
 * Set routing
 */
const mainRoutes = require('./routes/mainRoutes.js');

/**
 * Set session
 */
const { v4: uuidv4 } = require('uuid');
const session = require('express-session')({  
    genid: req => uuidv4(),
    secret: 'random string',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
 });
app.use(session);

/**
 * Set up app
 */
app.set('view engine', 'ejs');
app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: false }));


/**
 * Connect to database
 */
const dbURI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@${process.env.DB_CLUSTER}.ffgxc.mongodb.net/${process.env.DB_NAME}`;
mongoose.connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
.then(result => {
    server.listen(port);
});

/**
 * Direct requests to main router
 */
app.use('', mainRoutes);

/**
 * 404 Error Page
 */
app.use( (req, res) => {
    res.status(404).render('404', {title: 'Page Not Found'});
});


/*********************** Socket.io hanndling **********************/

const io = socketio(server);
io.use(ios(session));

io.on('connection', (socket) => {

    const sess = socket.handshake.session;

    // logic for when a user starts a socket session (only runs once)
    if (sess.name == undefined) sess.name = 'User'
    const user = sess.name;
    socket.join(sess.room); // connects user to the desired room
    Room.findOne({room: sess.room}) // updates the database with the user's room and socket info
    .then( result => {
        if (!result) return;

        result.sockets.push({
            socket: socket.id, 
            name: sess.name
        });
        Room.findOneAndUpdate({room: sess.room}, result)
        .then( res => {
            socket.emit('join', { // logic for the user joining the room
                joinMessage: `Welcome, ${user}!`,
                name: sess.name,
                isMaster: sess.isMaster,
                users: result.sockets
            });
            socket.broadcast.to(sess.room).emit('join', { // notifies everyone else of the user joining
                joinMessage: `${user} has joined the chat`,
                users: result.sockets
            });
        });
    });

    // updates everyone's chat when someone sends a message
    socket.on('updateChat', message => {
        socket.broadcast.to(sess.room).emit('chatUpdated', {message, name: sess.name});
    });

    // sets the time of either a specific user (if all = false), or all users (if all = true)
    // Note: a specific user's time is set when they conenct for the first time OR when they sync up
    // Note: all users' times are set when the host force syncs everyone (e.g. when they change their video state)
    socket.on('sendTime', ({time, state, to, all = false}) => {
        if (all) console.log(time)
        if (all) socket.broadcast.to(sess.room).emit('setTime', {time, state, hostChange: true});
        else io.sockets.connected[to].emit('setTime', {time, state, hostChange: false});
    });

    // syncs a user with the host (master socket) when they first join a room or sync up
    socket.on('sync', () => {
        // if the first user (the host) is joining the room
        if (sess.isMaster && !sess.masterSocket){
            Room.findOne({room: sess.room})
            .then( result => {
                result.masterSocket = socket.id;
                Room.findOneAndUpdate({room: sess.room}, result)
                .then( res => {

                })
            })
            sess.masterSocket = io.sockets.connected[socket.id];
        } else if (sess.isMaster) { // if the host is already connected and force syncing all the other users
            socket.broadcast.to(sess.room).emit('syncing');
            socket.emit('getTime', {to: 'all'})
        
        } else { // a user syncing up with host
            Room.findOne({room: sess.room})
            .then( result => {
                sess.masterSocket = io.sockets.connected[result.masterSocket];
                sess.masterSocket.emit('getTime', {to: socket.id}); // tell the host to send their time/status to the given socket id
            })
            .catch( err => {

            })
        }
    });

    // handles a user leaving a room
    socket.on('disconnect', () => {
        if (sess.isMaster){
            Room.deleteOne({room: sess.room})
            .then( result => {
                io.to(sess.room).emit('destroy');
            });

        } else {
            Room.findOne({room: sess.room})
            .then( result => {
                result.sockets = result.sockets.filter( val => val.socket != socket.id)
                Room.findOneAndUpdate({room: sess.room}, result)
                .then( res => {
                    io.to(sess.room).emit('join', {
                        joinMessage: `${user} has left the chat`,
                        users: result.sockets
                    });
                })

            });
        }
       sess.destroy(); // destroy the session to allow a fresh start later if needed
    });

});



