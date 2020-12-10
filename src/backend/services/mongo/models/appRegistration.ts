/* eslint-disable no-multi-spaces */
import { createSchema, Type, timestampSchema } from './index';

export const AppRegistrationApiKeySchema = createSchema({
  apiKey:                         Type.string({required: true, unique: true }),
  description:                    Type.string({ required: false }),
  isRevoked:                      Type.boolean({required: true, default: false }),
  createdOn:                      Type.date({ required: false }),
  revokedOn:                      Type.date({ required: false })
}, {_id: false, versionKey: false}); // disable _id for array subdocuments

export const AppRegistrationSchema = createSchema({
  _id:                              Type.string({required: true }),
  name:                             Type.string({required: true }),
  notificationEmails:               Type.array({ required: false }).of(Type.string({ required: false })),
  apiKeys:                          Type.array({ required: true }).of(
    AppRegistrationApiKeySchema
  ),
  ...timestampSchema
});
