const socket = io();

let state;
let chatWindow = document.querySelector('.chat');
let selfName;
const mainMsg = document.querySelector('.main-message h4');
let syncing = true;
let isMaster;
let users;
let buffered = false;
const chatContainer = document.querySelector('.chat-container');
const usersContainer = document.querySelector('.view-users-container');
const usersList = document.querySelector('.view-users-container ol');
const messageForm = document.querySelector('#msgForm');

/**
 * Logic to handle upon a user joining (current user or another user)
 */
socket.on('join', info => {
    document.querySelector("#message").innerText = info.joinMessage;
    if (!selfName){
        selfName = info.name;
    }
    if (!isMaster) {
        isMaster = info.isMaster
        mainMsg.innerText = 'You are the host';
    }
    users = info.users;
    document.querySelector('.numPeople').innerText = users.length;
    usersList.innerHTML = '';
    let li;
    users.forEach(userInfo => {
        li = document.createElement('li');
        li.innerText = userInfo.name;
        usersList.appendChild(li);
    });
});

socket.on('syncing', () => {
    syncing = true;
})

/**
 * Gets the time (used only if current user is the host)
 */
socket.on('getTime', ({to}) => {
    const time = player.getCurrentTime();
    all = false;
    if (to == 'all') all = true;
    socket.emit('sendTime', {time, state, to, all});
});

/**
 * Sets the time of the current user to match that of the host (if requested by host, or requested by user)
 */
socket.on('setTime', (info) => {
    const time = info.time;
    const s = info.state;
    player.seekTo(time);
    if (s == YT.PlayerState.PLAYING){
        player.playVideo();
        state = s;   
    } else if (s == YT.PlayerState.PAUSED) {
        player.pauseVideo();
        state = s;
    }

    if (info.hostChange == true) {
        mainMsg.innerText = 'The host changed the video state!';
        mainMsg.parentNode.classList.remove('alert-danger');
        mainMsg.parentNode.classList.remove('alert-success');
        mainMsg.parentNode.classList.add('alert-warning');
    }

    setTimeout(() => {
        document.querySelector('.sync').disabled = "";
    }, 3000);

});

/**
 * Updates the chat (e.g. when someone sends a message)
 */
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

/**
 * scrolls to the bottom of the chat
 */
const updateScroll = () => {
    const element = document.querySelector('.chat-container');
    element.scrollTop = element.scrollHeight;
}

 /**
  * - Updates the video state for the first time (for a regular user)
  * - Force Syncs all users whenever host changes video state
  */
const updateState = (e) => {
    
    if (e.data == YT.PlayerState.BUFFERING) {
        buffered = true; // usually happens when video time is deagged to a different point
    }
    
    else if (e.data == YT.PlayerState.PLAYING){
        state = YT.PlayerState.PLAYING;
        if (isMaster && (!syncing || buffered)) { // buffered solves the 2 -> 3 -> 1 state fluctuation when video is dragged by host
            buffered = false;
            syncUp();
        }
        else if (!syncing) {
            displayMsg(false);
        }
        setTimeout(() => {
            syncing = false;
        }, 1000);
    
    } else if (e.data == YT.PlayerState.PAUSED) {
        state = YT.PlayerState.PAUSED;
        if (isMaster && !syncing) {
            syncUp();
        }
        else if (!syncing) {
            displayMsg(false);
        }
        setTimeout(() => {
            syncing = false;
        }, 1000);

    }
    console.log("update State", e.data)
}

/**
 * Gets the id of the youtube video that is currently playing
 */
const getVideoId = () => {
    return videoID;
}

/**
 * Function that sends the socket message to sync up
 */
const syncUp = () => {
    syncing = true;
    //console.log(state)
    socket.emit('sync');
    displayMsg(true);
}

/**
 * Message state handling
 */
const displayMsg = inSync => {
    if (!isMaster) {
        if (inSync) {
            mainMsg.innerText = 'You are in sync with the host!';
            mainMsg.parentNode.classList.remove('alert-danger');
            mainMsg.parentNode.classList.remove('alert-warning');
            mainMsg.parentNode.classList.add('alert-success');
        } else {
            mainMsg.innerText = 'You are not in sync anymore!';
            mainMsg.parentNode.classList.remove('alert-success');
            mainMsg.parentNode.classList.remove('alert-warning');
            mainMsg.parentNode.classList.add('alert-danger');
        }
    }
}

/**
 * Updates chat of current user (ONLY if current user sends the message)
 */
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

/**
 * When "Sync Up" is pressed, sync and disable the button for a few seconds
 */
if (document.querySelector('.sync')) {
    document.querySelector('.sync').addEventListener('click', (e) => {
        syncUp();
        document.querySelector('.sync').disabled = "disabled";
    })
}

/**
 * Allows viewing the change Name form
 */
document.querySelector('#nameForm').addEventListener('submit', (e) => {
    e.preventDefault();
});

/**
 * Allows viewing the users list
 */
document.querySelector('.view-users').addEventListener('click', (e) => {
    chatContainer.style.display = 'none';
    messageForm.style.display = 'none';
    usersContainer.style.display = '';
});

/**
 * Allows viewing the chat
 */
document.querySelector('.view-chat').addEventListener('click', (e) => {
    usersContainer.style.display = 'none';
    chatContainer.style.display = '';
    messageForm.style.display = '';
});

