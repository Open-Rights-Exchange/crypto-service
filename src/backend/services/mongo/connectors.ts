import mongoose from 'mongoose'
import { globalLogger } from '../../../helpers/logger'

// Mongoose's built in promise library is deprecated, replace it with ES2015 Promise
mongoose.Promise = global.Promise
// Removes deprication warning
mongoose.set('useCreateIndex', true)

const options: any = {
  poolSize: 20,
  keepAlive: true, // contains type discrepancy in the docs (boolean vs number)?
  useNewUrlParser: true,
  useUnifiedTopology: true,
}

export function connectToMongo(mongoURI: string, mongoTimeout: number | string) {
  options.socketTimeoutMS = mongoTimeout
  options.connectTimeoutMS = mongoTimeout
  return new Promise((resolve, reject) => {
    mongoose.connect(mongoURI, options)
    mongoose.connection
      .once('open', () => {
        // globalLogger.log('Connected to MongoDB instance.')
        resolve(null)
      })
      .on('error', error => {
        globalLogger.error('Error connecting to MongoDB:', error)
      })
  })
}
