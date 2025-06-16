import { Schema, Repository } from 'redis-om'

import client from '../dbClient.js'

const chatSchema = new Schema('chat', {
  chatName: { type: 'string' },
  users: { type: 'string[]' },
  latestMessage: { type: 'string' },
  timestamp: { type: 'date' },
});

export const chatRepository = new Repository(chatSchema, client)

await chatRepository.createIndex()