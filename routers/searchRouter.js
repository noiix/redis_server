import { Router } from 'express'
import { userRepository } from '../om/user.js'

export const router = Router()

router.get('/all', async (req, res) => {
  const users = await userRepository.search().return.all()
  res.send(users)
})