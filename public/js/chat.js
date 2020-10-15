
// to-do: broadcast the controler
const socket = io();

socket.on('join', message => {
    console.log(message);
    document.querySelector("#message").innerText = message.joinMessage;

    // if (message.videoID){
    //     const videoID = message.videoID;
    // }
});

function getVideoId() {
    return videoID
}

document.querySelector('#msgForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const message = e.target.elements.input.value;
    e.target.elements.input.value = '';
    socket.emit('update', message);
});

let chatWindow = document.querySelector('.chat');

socket.on('chatUpdated', message => {
    let p = document.createElement('p');   
    p.innerText = message;
    chatWindow.appendChild(p);
});

const dod = (time) => {
    //socket.emit('time', time);
    //if ()
}
// clicked = false;
// document.querySelector('iframe').addEventListener('click', (e) => {
//     console.log("THIS", e);
// })




const updateState = (e) => {
    console.log('here')
    if (e.data == YT.PlayerState.BUFFERING){

    }
    else if (e.data == YT.PlayerState.PLAYING){
        socket.emit('play');
        //syncUp();

        
    } else if (e.data == YT.PlayerState.PAUSED) {
        socket.emit('pause');
        //syncUp();

        
    }
}

// const syncUp = () => {
//     socket.emit('sync');
// }

socket.on('updatePlay', (time) => {
    player.seekTo(time);
    player.playVideo();
    console.log('changed')
    //syncUp();
});

socket.on('updatePause', (time) => {
    player.seekTo(time);
    player.pauseVideo();
});

socket.on('getTime', () => {
    const time = player.getCurrentTime();
    socket.emit('sendTime', time);
});

// socket.on('setTime', (time) => {
//     console.log(time)
//     player.seekTo(time);
// });


