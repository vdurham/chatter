import { IChatMessage } from '../common/chatMessage.interface';
import { io, Socket } from 'socket.io-client';
import axios, { AxiosResponse } from 'axios';
import { IResponse } from '../common/server.responses';
import { IUser } from '../common/user.interface';
import {
  ServerToClientEvents,
  ClientToServerEvents
} from '../common/socket.interface';
import { get } from 'jquery';

const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io();
const token = localStorage.getItem('token');
const currentUser = localStorage.getItem('currentUser');

function onLogout(e: Event): void {
  e.preventDefault();
  // Logout by deleting locally stored token and current user
  localStorage.removeItem('token');
  localStorage.removeItem('currentUser');
  // Redirect the user to the Authentication page
  window.location.href = '../../pages/auth.html';
  alert('You have been logged out.');
}

function makeChatMessage(
  author: string,
  displayName: string,
  timestamp: string,
  text: string
): void {
  // Create an HTML element that contains a chat message
  const chatElement = document.createElement('div');

  let justify: string;
  if (author === currentUser) {
    justify = 'flex-end';
  } else {
    justify = 'flex-start';
  }

  chatElement.innerHTML = `
    <div class="form-row" style="justify-content: ${justify};">
      <span class="chat-container">
        <span class="chat-header">
          <span class="chat-sender">${displayName}</span>
          <span class="chat-timestamp">${timestamp}</span>
        </span>
        <span class="chat-message">${text}</span>
    </div>
  `;

  // Append chatElement to the chat list
  const chatList = document.getElementById('existingChatMessages');
  if (chatList) {
    chatList.appendChild(chatElement);
    chatList.scrollTo(0, chatList.scrollHeight);
  }
}

async function postChatMessage(
  chatMessage: IChatMessage
): Promise<IChatMessage | null> {
  try {
    const res: AxiosResponse = await axios.request({
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      data: chatMessage,
      url: '/chat/messages',
      validateStatus: () => true
    });
    if (res.status >= 200 && res.status < 300) {
      return res.data.payload;
    } else {
      alert(`Failed to post chat message. ${res.data.message}`);
      return null;
    }
  } catch (error) {
    alert(`An error occured during message posting. ${error.message}`);
    return null;
  }
}

async function onLeave(): Promise<void> {
  if (confirm('Are you sure you want to leave permanently?')) {
    try {
      const res: AxiosResponse = await axios.request({
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
        url: `/chat/users/${currentUser}`,
        validateStatus: () => true
      });
      if (res.status >= 200 && res.status < 300) {
        localStorage.removeItem('token');
        localStorage.removeItem('currentUser');
        alert(res.data.message);
        window.location.href = '../../pages/auth.html';
      } else {
        alert(`Failed to leave chat. ${res.data.message}`);
      }
    } catch (error) {
      alert(`An error occured during chat leaving. ${error.message}`);
    }
  }
}

async function onPost(e: Event): Promise<void> {
  e.preventDefault();
  const chatMessageInput = document.getElementById(
    'chatMessage'
  ) as HTMLTextAreaElement;
  const text = chatMessageInput.value.trim();

  const chatMessage: IChatMessage = { author: currentUser, text };
  const savedMessage = await postChatMessage(chatMessage);
  if (savedMessage) {
  }

  chatMessageInput.value = '';
}

async function getChatMessages(): Promise<void> {
  // TODO: get all chat messages from the server
  try {
    const res: AxiosResponse = await axios.request({
      method: 'GET',
      headers: { Authorization: `Bearer ${token}` },
      url: '/chat/messages',
      validateStatus: () => true
    });
    if (res.status >= 200 && res.status < 300) {
      res.data.payload.forEach((chatMsg: IChatMessage) => {
        const displayName = chatMsg.displayName || chatMsg.author;
        const timestamp = chatMsg.timestamp || new Date().toISOString();
        makeChatMessage(chatMsg.author, displayName, timestamp, chatMsg.text);
      });
    } else {
      alert(`Failed to get chat messages. ${res.data.message}`);
    }
  } catch (error) {
    alert(`An error occured during message retrieval. ${error.message}`);
  }
}

function onNewChatMessage(chatMsg: IChatMessage): void {
  // TODO: eventhandler for websocket incoming new-chat-message
  // used to update chat message list
  try {
    const displayName = chatMsg.displayName || chatMsg.author;
    const timestamp = chatMsg.timestamp || new Date().toISOString();
    makeChatMessage(chatMsg.author, displayName, timestamp, chatMsg.text);
  } catch (error) {
    console.error('Error updating chat message list:', error);
  }
}

async function isLoggedIn(): Promise<boolean> {
  const T = localStorage.getItem('token');
  const CU = localStorage.getItem('currentUser');

  if (T === null || CU === null) {
    return false;
  } else {
    try {
      const res: AxiosResponse = await axios.request({
        method: 'GET',
        headers: { Authorization: `Bearer ${T}` },
        url: `/chat/users/${CU}`,
        validateStatus: () => true
      });
      if (res.status >= 200 && res.status < 300) {
        if (res.data.payload.credentials.username == CU) {
          return true;
        }
      } else {
        return false;
      }
    } catch (err) {
      return false;
    }
    return true;
  }
}

function pageSetup(): void {
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', onLogout);
  }
  const postBtn = document.getElementById('postBtn');
  if (postBtn) {
    postBtn.addEventListener('click', onPost);
  }
  const leaveBtn = document.getElementById('leaveBtn');
  if (leaveBtn) {
    leaveBtn.addEventListener('click', onLeave);
  }
  getChatMessages();
  socket.on('newChatMessage', onNewChatMessage);
}

const loggedIn = await isLoggedIn();
if (!loggedIn) {
  window.location.href = '../../pages/auth.html';
} else {
  if (document.readyState === 'complete') {
    pageSetup();
  } else {
    document.addEventListener('DOMContentLoaded', pageSetup);
  }
}
