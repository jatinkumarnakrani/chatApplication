'use strict'

var usernamePage = document.querySelector("#username-page");
var chatPage = document.querySelector("#chat-page");
var usernameForm = document.querySelector("#usernameForm");
var messageForm = document.querySelector("#messageForm");
var messageInput = document.querySelector("#message");
var messageArea = document.querySelector("#messageArea");
var connectingElement = document.querySelector(".connecting");


var stopmClient = null;
var username = null;
var colors = [
    '#2196F3', '#32c787', '#00BCD4', '#ff5653',
    '#ffc107', '#ff85af', '#FF9800', '#39bbb0'
];


function connect(event) {
    username = document.querySelector('#name').value.trim();

    if (username){
        usernamePage.classList.add('d-none');
        chatPage.classList.remove('d-none');
        document.querySelector("#username").textContent = username;
        try {
            var socket = new SockJS('/ws');
            stopmClient = Stomp.over(socket);

            stopmClient.connect({},onConnect, onError);
        } catch (e) {
            console.log(e);
        }
    }

    if (!username) {
        alert("Type username to enter chatroom");
    }
    event.preventDefault();
}

function onConnect() {
    // subscribe to the public Topic
    stopmClient.subscribe('/topic/public', onMessageReceived);

    // tell username to the server
    stopmClient.send('/app/chat.addUser', {}, JSON.stringify({sender: username, type: 'JOIN'}));
}

function onMessageReceived(payload){

    var message = JSON.parse(payload.body);

    var messageElement = document.createElement('li');
    messageElement.classList.add("d-flex", "justify-content-between");
    if (message.type === 'JOIN' || message.type === 'LEAVE') {
        var pElement = document.createElement('p');
        pElement.classList.add("text-center", "mx-3", "mb-0");
        if (message.type === 'JOIN'){
            pElement.textContent= message.sender + ' joined!';
        }
        if (message.type === 'LEAVE'){
            pElement.textContent= message.sender + ' left!';
        }

        var divElement = document.createElement('div');
        divElement.classList.add("divider", "d-flex", "align-items-center");
        divElement.appendChild(pElement);
        messageElement.appendChild(divElement);

    } else {
        messageElement.classList.add('mb-4');

        var avatarElement = document.createElement('i');
        var avatarText = document.createTextNode(message.sender[0]);
        avatarElement.classList.add("circular-element");
        avatarElement.appendChild(avatarText);
        avatarElement.style['background-color'] = getAvatarColor(message.sender);

        var divCard = document.createElement("div");
        divCard.classList.add("card", "mask-custom", "w-100");
        var divCardHeader = document.createElement("div");
        divCardHeader.classList.add("card-header", "d-flex", "justify-content-between", "p-3");
        var divCardHeaderName = document.createElement("p");
        divCardHeaderName.classList.add("fw-bold", "mb-0", "text-light");
        divCardHeaderName.textContent = message.sender;
        var divCardHeaderTime = document.createElement("p");
        divCardHeaderTime.classList.add("text-light", "small", "mb-0");
        divCardHeaderTime.textContent = message.time;

        divCardHeader.appendChild(divCardHeaderName);
        divCardHeader.appendChild(divCardHeaderTime);

        var divCardBody = document.createElement("div");
        divCardBody.classList.add("card-body");
        var textMsg = document.createElement('p');
        textMsg.classList.add("mb-0","text-light");
        textMsg.textContent = message.content;
        divCardBody.appendChild(textMsg);

        divCard.appendChild(divCardHeader);
        divCard.appendChild(divCardBody);
        messageElement.append(divCard);

        if (message.sender === document.querySelector('#name').value.trim()) {
            avatarElement.classList.add("ms-2");
            messageElement.appendChild(avatarElement);
        }else {
            avatarElement.classList.add("me-2");
            messageElement.prepend(avatarElement);
        }

    }
    messageArea.appendChild(messageElement);
    messageArea.scrollTop = messageArea.scrollHeight;

}

function onError() {
    connectingElement.textContent = 'Could not connect to WebSocket server. PLease refresh this page and try!';
    connectingElement.style.color = 'red';
}

function sendMessage(event) {
    var messageContent = messageInput.value.trim();
    if (messageContent && stopmClient) {
        var currentdate = new Date();
        var chatMessage = {
            sender: username,
            content: messageContent,
            type: 'CHAT',
            time: currentdate.getHours() + ":" + currentdate.getMinutes()
        };
        messageInput.value = '';
        stopmClient.send('/app/chat.sendMessage', {}, JSON.stringify(chatMessage));
    }
    event.preventDefault();
}

function getAvatarColor(messageSender) {
    var hash = 0;
    for (var i = 0; i < messageSender.length; i++) {
        hash = 31 * hash + messageSender.charCodeAt(i);
    }
    var index = Math.abs(hash % colors.length);
    return colors[index];
}

usernameForm.addEventListener('submit', connect, true);
messageForm.addEventListener('submit', sendMessage, true);

