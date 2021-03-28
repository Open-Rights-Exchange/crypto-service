import { createSchema, Type, timestampSchema } from './index'

export const TransportKeySchema = createSchema({
  _id: Type.string({ required: true }),
  appId: Type.string({required: true }),
  maxUseCount: Type.number({ required: true, default: 1 }),
  publicKey: Type.string({ required: true }),
  privateKeyEncrypted: Type.string({ required: true }),
  expiresOn: Type.date({ required: true }),
  ...timestampSchema,
})
// auto-delete rows that have expired
TransportKeySchema.index({ expiresOn: 1 }, { expireAfterSeconds: 0 })
