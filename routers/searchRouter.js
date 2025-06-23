import { Router } from 'express'
import { userRepository } from '../om/user.js'
import { auth } from '../middleware/auth.js'

export const router = Router()

router.get('/all', auth, async (req, res) => {
  const users = await userRepository.search().return.all()
  res.send(users)
})