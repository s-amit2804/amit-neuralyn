const express = require('express');
const router = express.Router();
const {
  startChat,
  sendMessage,
  getAllChats,
  getChat,
  endChat,
} = require('../controllers/chatController');
const { protect, authorize } = require('../middleware/auth');

router.post('/', protect, authorize('user'), startChat);              // Start a new chatbot session
router.post('/:id/message', protect, authorize('user'), sendMessage); // Send a message + get bot reply
router.get('/', protect, authorize('user'), getAllChats);              // List all chats (summary only)
router.get('/:id', protect, authorize('user'), getChat);              // Get full chat with messages
router.put('/:id/end', protect, authorize('user'), endChat);          // End chat, save summary

module.exports = router;
