import mongoose from 'mongoose'
import { logger } from '../../../helpers/logger'

require('dotenv').config()

// Mongoose's built in promise library is deprecated, replace it with ES2015 Promise
mongoose.Promise = global.Promise
// Removes deprication warning
mongoose.set('useCreateIndex', true)

const options: any = {
  poolSize: 20,
  socketTimeoutMS: process.env.MONGO_TIMEOUT,
  connectTimeoutMS: process.env.MONGO_TIMEOUT,
  keepAlive: true, // contains type discrepancy in the docs (boolean vs number)?
  reconnectTries: 30,
  useNewUrlParser: true,
}

export function connectToMongo(mongoURI: string) {
  return new Promise((resolve, reject) => {
    mongoose.connect(mongoURI, options)
    mongoose.connection
      .once('open', () => {
        logger.log('Connected to MongoDB instance.')
        resolve(null)
      })
      .on('error', error => {
        logger.error('Error connecting to MongoDB:', error)
      })
  })
}
