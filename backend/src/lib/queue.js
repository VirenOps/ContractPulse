import { Queue } from 'bullmq'
import Redis from 'ioredis'

export const connection = new Redis(process.env.REDIS_URL, {
  maxRetriesPerRequest: null
})

export const contractQueue = new Queue('contract-processing', { connection })
export const escalationQueue = new Queue('escalation', { connection })