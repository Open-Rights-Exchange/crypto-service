/* eslint-disable no-multi-spaces */
import { createSchema, Type, timestampSchema } from './index';

export const AppConfigSchema = createSchema({
  _id:                      Type.string({required: true }),
  appId:                    Type.string({required: true }),
  type:                     Type.string({ required: true }),
  name:                     Type.string({ required: true }),
  value:                    Type.string({ required: true }),
  ...timestampSchema
});

AppConfigSchema.index({ appId: 1, type: 1, name: 1 }, { unique: true });
