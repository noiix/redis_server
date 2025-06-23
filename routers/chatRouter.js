import express from 'express';
import { auth } from '../middleware/auth.js';
import { fetchChats } from '../controllers/chatController.js';

export const router = express.Router();

router.post('/getallchats', auth, fetchChats);