const { render } = require('ejs');
const express = require('express');
const bodyParser = require('body-parser');
const parse = require('url-parse');
const http = require('http');
const app = express();
const socketio = require('socket.io');
const server = http.createServer(app);
const mongoose = require('mongoose');
const Room = require('./models/room.js');
const config = require('./config.js');
const io = socketio(server);
const port = process.env.PORT || 3000;
const { v4: uuidv4 } = require('uuid');
const urllib = require('urllib');
const ios = require('socket.io-express-session');

const session = require('express-session')({  
    genid: req => uuidv4(),
    secret: 'random string',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
 });

 app.use(session)

io.use(ios(session))


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

    const sess = socket.handshake.session;

    console.log('Webscoket connection working!');
    if (sess.name == undefined) sess.name = 'User'
    const user = sess.name;

    socket.join(sess.room);
    socket.emit('join', {
        joinMessage: `Welcome, ${user}!`,
        name: sess.name,
        isMaster: sess.isMaster
    });
    socket.broadcast.to(sess.room).emit('join', {
        joinMessage: `${user} has joined the chat`
    });

    socket.on('updateChat', message => {
        socket.broadcast.to(sess.room).emit('chatUpdated', {message, name: sess.name});
    });

    socket.on('sendTime', ({time, state, to, all = false}) => {
        console.log(all);
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
                    console.log('yess')
                })
                .catch(err => {
                    console.log(err);
                })
            })
            .catch( err => {
                console.log(err);
            })
            sess.masterSocket = io.sockets.connected[socket.id];
        } else if (sess.isMaster) {
            socket.broadcast.to(sess.room).emit('syncing');
            socket.emit('getTime', {to: 'all'})
        }
        else {
            Room.findOne({room: sess.room})
            .then( result => {
                console.log(result)
                sess.masterSocket = io.sockets.connected[result.masterSocket];
                sess.masterSocket.emit('getTime', {to: socket.id});
            })
            .catch( err => {
                console.log(err);
            })
        }
    });

    socket.on('disconnect', () => {

        io.to(sess.room).emit('join', {
            joinMessage: `${user} has left the chat`
        });
        if (sess.isMaster){
            Room.deleteOne({room: sess.room})
            .then( result => {
                console.log('Yay')
            })
            .catch (err => {
                console.log(err);
            })
        }
       sess.destroy();
        
    });

});

app.get('/checkRoom', (req, res) => {
    const room = parseInt(req.query.room);
    if (isNaN(room) || room.length < 5) {
        res.send(JSON.stringify('Not Valid'));
    } else {
        Room.findOne({room: room})
        .then(result => {
            if (result == null){
                res.send(JSON.stringify('Not Valid'))
            } else {
                res.send(JSON.stringify('Valid'))
            }
        })
        .catch (err =>
            res.send(JSON.stringify('Not Valid'))
        )
    }

})

app.get('/checkURL', (req, res) => {
    const url = req.query.url;
    urllib.request(url)
    .then( response => {

        if (response.status != 200){
            res.send(JSON.stringify('That URL is not a valid YouTube URL'));
        } else {
            res.send(JSON.stringify('Valid'));
        }
    })
    .catch(err => {
        res.send(JSON.stringify('That URL is not a valid YouTube URL'));
    })

})

/**
 * Used by Fetch API to get youtube video ID
 */

app.get('/videoID', (req, res) => {
    res.send(JSON.stringify(req.session.embedID));
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


app.get('/login', (req, res) => {
    res.render('login', {title: 'Login'});
});

app.get('/sign-up', (req, res) => {
    res.render('sign-up', {title: 'Sign Up'});
});

/**
 * Synced Video Page
 */

app.post('/watch', (req, res) => {
    // do double input check and also check for valid url/room
    if (req.body.room != ''){
        req.session.name = req.body.name;
        req.session.room = req.body.room;
        Room.findOne({room: req.body.room})
        .then( result => {
            console.log(result)
            req.session.embedID = result.videoID;
            req.session.isMaster = false;
            res.render('watch', {title: 'Watch', room: req.session.room, master: false});
        })
        .catch( err => {
            console.log(err);
        })
    } else if (req.body.url != '') {
        req.session.name = req.body.name;
        const url = parse(req.body.url, true);   
        req.session.embedID = url.query.v;
        const roomID = Math.floor(Math.random() * 100000);
        req.session.room = roomID;
        const room = new Room({room: roomID, videoID: req.session.embedID});
        req.session.isMaster = true;
        room.save()
        .then( result => {
            res.render('watch', {title: 'Watch', room: req.session.room, master: true});
        })
        .catch( err => {
            console.log(err);
        })
    }   
});

app.post('/name', (req, res) => {
    //if (!req.session.name){
        const room = req.body.room;
        req.session.room = room;
        res.render('name', {title: 'Enter Name'});
    // } else {
    //     res.redirect(307, '/join');
    // }

})

app.use( (req, res) => {
    res.status(404).render('404', {title: 'Page Not Found'});
});




