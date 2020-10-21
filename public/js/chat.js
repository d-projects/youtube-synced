
// to-do: broadcast the controller
// toggle classList
// disable buttons while processing
// change chat.js to something else
const socket = io();

let state;

socket.on('join', message => {
    document.querySelector("#message").innerText = message.joinMessage;
});

function getVideoId() {
    return videoID;
}

document.querySelector('#msgForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const message = e.target.elements.chatInput.value;
    e.target.elements.chatInput.value = '';
    socket.emit('updateChat', message);
});

let chatWindow = document.querySelector('.chat');

socket.on('chatUpdated', message => {
    let p = document.createElement('p');   
    p.innerText = message;
    chatWindow.appendChild(p);
});

const updateState = (e) => {
    
    if (e.data == YT.PlayerState.BUFFERING){
    }
    else if (e.data == YT.PlayerState.PLAYING){
        state = YT.PlayerState.PLAYING       
    } else if (e.data == YT.PlayerState.PAUSED) {
        state = YT.PlayerState.PAUSED   
    }
}


const syncUp = () => {
    socket.emit('sync');
}

socket.on('getTime', () => {
    const time = player.getCurrentTime();
    socket.emit('sendTime', {time, state});
    console.log(state);
});

socket.on('setTime', ({time, state: s}) => {
    player.seekTo(time);
    if (s == YT.PlayerState.PLAYING){
        player.playVideo();
        state = s;   
    } else if (s == YT.PlayerState.PAUSED) {
        player.pauseVideo();
        state = s;
    }
});

document.querySelector('.sync').addEventListener('click', (e) => {
    syncUp();
})

