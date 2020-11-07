const Room = require('../models/room.js');
const urllib = require('urllib');
const parse = require('url-parse');

/**
 * Home Page
 */

const main_index = (req, res) => {
    res.render('index', {title: 'Home'});
}

/**
 * The login page
 */

const main_login_get = (req, res) => {
    res.render('login', {title: 'Login'});
}

/**
 * THe Sign Up Page
 */

const main_signUp_get = (req, res) => {
    res.render('sign-up', {title: 'Sign Up'});
}

/**
 * The page shown if multiple tabs of the site are opened
 */

const main_noAccess_get = (req, res) => {
    render('noAccess', {title: 'No Access'});
}

/**
 * Used by Fetch API to get youtube video ID
 */

const main_videoID_get = (req, res) => {
    res.send(JSON.stringify(req.session.embedID));
}

/**
 * Used by Fetch API to verify the URL entered on the home page
 */

const main_checkURL_get = (req, res) => {
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

}

/**
 * Used by Fetch API to verify the room entered is valid
 */

const main_checkRoom_get = (req, res) => {
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

}

/**
 * Page to watch a Youtube Video in sync
 */

const main_watch_post = (req, res) => {
    // do double input check and also check for valid url/room
    if (req.body.room != ''){
        req.session.name = req.body.name;
        req.session.room = req.body.room;
        Room.findOne({room: req.body.room})
        .then( result => {
            req.session.embedID = result.videoID;
            req.session.isMaster = false;
            res.render('watch', {title: 'Watch', room: req.session.room, master: false});
        })
        .catch( err => {

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

        })
    }   
}

module.exports = {
    main_index,
    main_login_get,
    main_signUp_get,
    main_noAccess_get,
    main_videoID_get,
    main_checkURL_get,
    main_checkRoom_get,
    main_watch_post
};