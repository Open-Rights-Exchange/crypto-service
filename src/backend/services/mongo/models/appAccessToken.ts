/* eslint-disable no-multi-spaces */
import { createSchema, Type, timestampSchema } from './index'

export const AppAccessTokenSchema = createSchema({
  _id: Type.string({ required: true }),
  appId: Type.string({ required: true }),
  expiresOn: Type.date({ required: true }),
  metadata: {
    newAccountPassword: Type.string({ required: false }),
    currentAccountPassword: Type.string({ required: false }),
    secrets: [
      {
        type: Type.string({ required: true }),
        value: Type.string({ required: true }),
      },
    ],
  },
  ...timestampSchema,
})
// auto-delete rows that have expired
AppAccessTokenSchema.index({ expiresOn: 1 }, { expireAfterSeconds: 0 })
