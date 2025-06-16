import { Schema, Repository } from 'redis-om'

import client from '../dbClient.js'

const userSchema = new Schema('User', {
  email: { type: 'string' },
  password: { type: 'string' },
  verified: { type: 'boolean' },
  createdAt: { type: 'date' },
  genre: { type: 'string[]' },
  instruments: { type: 'string[]' },
  likedSongs: { type: 'string[]' },
  introText: { type: 'text' },
  location: { type: 'point' },
  music: { type: 'string[]' },
  contacts: { type: 'string[]' },
  _id: { type: 'string' }
});

export const userRepository = new Repository(userSchema, client)

await userRepository.createIndex()
