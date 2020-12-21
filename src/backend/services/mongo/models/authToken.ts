/* eslint-disable no-multi-spaces */
import { createSchema, Type, timestampSchema } from './index'

export const AuthTokenSchema = createSchema({
  _id: Type.string({ required: true }),
  appId: Type.string({ required: true }),
  expiresOn: Type.date({ required: true }),
  token: Type.string({ required: true, unique: true }),
  ...timestampSchema,
})
// auto-delete rows that have expired
AuthTokenSchema.index({ expiresOn: 1 }, { expireAfterSeconds: 0 })
