import { Convert, createSchema, Definition, DefinitionField, ExtractData, ExtractDoc, Type, typedModel, ObjectId, timestampSchema } from './_helpers';

// MongoDB Schema files
import { AppAccessTokenSchema } from './appAccessToken';


// export ts-mongoose 
export { Convert, createSchema, Definition, DefinitionField, ExtractData, ExtractDoc, Type, typedModel, ObjectId, timestampSchema };

// export { ObjectId } from './_helpers';

/** Mongoose objects of each data type */
export const Mongo = {
  AppAccessToken: typedModel('AppAccessToken', AppAccessTokenSchema, 'appAccessTokens'),
};

/** Given a Mongoose result, these types transform it into the just the data properties  
 *  These types are typically used in our mongo helper functions
 *  Ex: user = findOneMongo<UserData>() yields a typed response: user.email */
export type AppAccessTokenData = ExtractData<typeof AppAccessTokenSchema>;

/** Typed Mongoose objects - of form:  Model<Document & {...schema}> */
export type AppAccessTokenType = typeof Mongo.AppAccessToken;
