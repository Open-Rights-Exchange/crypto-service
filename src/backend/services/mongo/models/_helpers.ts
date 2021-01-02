/* eslint-disable no-multi-spaces */
import { now } from '../../../../helpers';
import { Convert, createSchema, Definition, DefinitionField, Type, typedModel, ExtractDoc } from '../../../libraries/ts-mongoose';
import { ObjectId } from 'bson';
import { ExtractData } from './_extractData';
/** adds timestamps and creator/updater fields */
const timestampSchema = {
  createdOn: Type.date({ default: now() as any }),
  createdBy: Type.string({ required: true }),
  updatedOn: Type.date({ required: true }),
  updatedBy: Type.string({ required: true }),
};

/** Mongoose ObjectId standard type */
// type ObjectId = mongoose.Schema.Types.ObjectId;

// We use the standard BSON ObjectId since Mongoose ObjectId is a different, depricated type

export function toObjectId(value:string | number): ObjectId {
  return new ObjectId(value);
}

export {
  Convert,
  createSchema,
  Definition, 
  DefinitionField, 
  Type, 
  typedModel, 
  ExtractDoc,
  ExtractData,
  ObjectId,
  timestampSchema
};
