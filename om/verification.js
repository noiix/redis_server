import { Schema, Repository } from 'redis-om'
import client from '../dbClient.js'

const verificationSchema = new Schema('Verification', {
  authId: { type: 'string' },
  secretKey: { type: 'string' },
});

export const verificationRepository = new Repository(verificationSchema, client);

await verificationRepository.createIndex();
