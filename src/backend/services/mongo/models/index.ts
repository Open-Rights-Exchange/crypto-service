import { Convert, createSchema, Definition, DefinitionField, ExtractData, ExtractDoc, Type, typedModel, ObjectId, timestampSchema } from './_helpers';

// MongoDB Schema files
import { AppConfigSchema } from './appConfig';
import { TransportKeySchema } from './transportKey';
import { AppRegistrationApiKeySchema, AppRegistrationSchema } from './appRegistration';

// export ts-mongoose 
export { Convert, createSchema, Definition, DefinitionField, ExtractData, ExtractDoc, Type, typedModel, ObjectId, timestampSchema };

// export { ObjectId } from './_helpers';

/** Mongoose objects of each data type */
export const Mongo = {
  AppRegistration: typedModel('AppRegistration', AppRegistrationSchema, 'appRegistrations'),
  AppConfig: typedModel('AppConfig', AppConfigSchema, 'appConfig'),
  TransportKey: typedModel('TransportKey', TransportKeySchema, 'transportKeys'),
};

/** Given a Mongoose result, these types transform it into the just the data properties  
 *  These types are typically used in our mongo helper functions
 *  Ex: user = findOneMongo<UserData>() yields a typed response: user.email */
export type AppRegistrationData = ExtractData<typeof AppRegistrationSchema>;
export type AppConfigData = ExtractData<typeof AppConfigSchema>;
export type TransportKeyData = ExtractData<typeof TransportKeySchema>;
// sub schemas
export type AppRegistrationApiKeyData = ExtractData<typeof AppRegistrationApiKeySchema>;
