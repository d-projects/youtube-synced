
// to-do: broadcast the controller
// toggle classList
// disable buttons while processing

const socket = io();

let state;
let chatWindow = document.querySelector('.chat');
let selfName;

socket.on('join', info => {
    document.querySelector("#message").innerText = info.joinMessage;
    selfName = info.name;
});

socket.on('getTime', ({to}) => {
    const time = player.getCurrentTime();
    socket.emit('sendTime', {time, state, to});
    console.log(to)
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

socket.on('chatUpdated', ({message, name}) => {
    let n = document.createElement('p');  
    n.innerText = name;
    n.classList.add('message-name-other');
    chatWindow.appendChild(n);
    let p = document.createElement('p');   
    p.innerText = message;
    p.classList.add('message-other');
    chatWindow.appendChild(p);
    updateScroll();
});

const updateScroll = () => {
    const element = document.querySelector('.chat-container');
    element.scrollTop = element.scrollHeight;
}

const updateState = (e) => {
    
    if (e.data == YT.PlayerState.BUFFERING){
    }
    else if (e.data == YT.PlayerState.PLAYING){
        state = YT.PlayerState.PLAYING       
    } else if (e.data == YT.PlayerState.PAUSED) {
        state = YT.PlayerState.PAUSED   
    }
}

const getVideoId = () => {
    return videoID;
}

const syncUp = () => {
    socket.emit('sync');
}

document.querySelector('#msgForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const message = e.target.elements.chatInput.value;
    e.target.elements.chatInput.value = '';
    let n = document.createElement('p');  
    n.innerText = selfName;
    n.classList.add('message-name-self');
    chatWindow.appendChild(n);
    let p = document.createElement('p');   
    p.innerText = message;
    p.classList.add('message-self');
    chatWindow.appendChild(p);
    socket.emit('updateChat', message);
    updateScroll();
});

document.querySelector('.sync').addEventListener('click', (e) => {
    syncUp();
})

