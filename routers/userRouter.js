import express from 'express';
import { userRepository } from '../om/user.js'
import { auth } from '../middleware/auth.js';
import { createUser, emailVerify, googleAuthController, login, logout, showUser, deleteUser } from '../controllers/userController.js'

export const router = express.Router();

router.put('/', async (req, res) => {
  const email = req.body.email
  const user = await userRepository.search()
  .where('email').equals(email).return.all()

  if(user.length < 1) {
    createUser(req, res)
  } else {
    res.json({
      notification: {
        title: "Hey, you already have an account",
        type: "info",
    },
  });
  }
})

router.post('/login', async (req, res) => {
  login(req, res)
})

router.get("/logout", logout);

router.post("/googleauth", googleAuthController);

router.get("/verify/:authId.:secretKey", async (req, res) => {
  emailVerify(req, res)
});

router.get('/:id', auth, async (req, res) => {
  showUser(req, res)
})

router.post('/:id', auth, async (req, res) => {
  profileUpdate(req, res)
})

router.delete('/:id', auth, async (req, res) => {
  deleteUser(req, res);
})