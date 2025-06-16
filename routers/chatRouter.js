import express from 'express';
// import { fetchChats } from '../controllers/chatController';
import { auth } from "../middleware/checkLoggedIn";
import { fetchChats } from '../controllers/chatController';

export const router = express.Router();

// router.post('/getallchats', auth, fetchChats);