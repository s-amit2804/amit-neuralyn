import api from './api';

export async function listChats() {
  const response = await api.get('/chat');
  return response.data.data;
}

export async function startChatSession() {
  const response = await api.post('/chat');
  return response.data.data;
}

export async function getChatSession(chatId) {
  const response = await api.get(`/chat/${chatId}`);
  return response.data.data;
}

export async function getOrCreateActiveChat() {
  const chats = await listChats();
  const activeChat = chats.find((chat) => chat.status === 'active');

  if (activeChat) {
    return getChatSession(activeChat._id);
  }

  return startChatSession();
}

export async function sendMessage(chatId, content) {
  const response = await api.post(`/chat/${chatId}/message`, { content });
  return response.data.data;
}

export async function endChatSession(chatId) {
  const response = await api.put(`/chat/${chatId}/end`);
  return response.data.data;
}
