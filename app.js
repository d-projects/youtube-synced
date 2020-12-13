const { render } = require('ejs');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const mongoose = require('mongoose');
const Room = require('./models/room.js');
const config = require('./config.js');
const socketio = require('socket.io');
const http = require('http');
const server = http.createServer(app);
const ios = require('socket.io-express-session');
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
const dbURI = `mongodb+srv://${config.db_user}:${config.db_password}@${config.db_cluster}.ffgxc.mongodb.net/${config.db_name}`;
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

    if (sess.name == undefined) sess.name = 'User'
    const user = sess.name;
    socket.join(sess.room);
    Room.findOne({room: sess.room})
    .then( result => {
        if (!result) return;

        result.sockets.push({
            socket: socket.id, 
            name: sess.name
        });
        Room.findOneAndUpdate({room: sess.room}, result)
        .then( res => {
            socket.emit('join', {
                joinMessage: `Welcome, ${user}!`,
                name: sess.name,
                isMaster: sess.isMaster,
                users: result.sockets
            });
            socket.broadcast.to(sess.room).emit('join', {
                joinMessage: `${user} has joined the chat`,
                users: result.sockets
            });
        });
    });

    socket.on('updateChat', message => {
        socket.broadcast.to(sess.room).emit('chatUpdated', {message, name: sess.name});
    });

    socket.on('sendTime', ({time, state, to, all = false}) => {
        if (all) socket.broadcast.to(sess.room).emit('setTime', {time, state, hostChange: true});
        else io.sockets.connected[to].emit('setTime', {time, state, hostChange: false});
    });

    socket.on('sync', () => {
        if (sess.isMaster && !sess.masterSocket){
            Room.findOne({room: sess.room})
            .then( result => {
                result.masterSocket = socket.id;
                Room.findOneAndUpdate({room: sess.room}, result)
                .then( res => {

                })
            })
            sess.masterSocket = io.sockets.connected[socket.id];
        } else if (sess.isMaster) {
            socket.broadcast.to(sess.room).emit('syncing');
            socket.emit('getTime', {to: 'all'})
        }
        else {
            Room.findOne({room: sess.room})
            .then( result => {
                sess.masterSocket = io.sockets.connected[result.masterSocket];
                sess.masterSocket.emit('getTime', {to: socket.id});
            })
            .catch( err => {

            })
        }
    });

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
       sess.destroy();
    });

});



