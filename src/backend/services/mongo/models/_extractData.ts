import { Document, Types } from 'mongoose';
import {
  SubDocument,
  SubDocumentNoId,
  SubDocumentArray,
  SubDocumentArrayNoId,
} from '../../../libraries/ts-mongoose/types/_shared';
import { Convert, Definition, DefinitionField } from './index';

/** extracts only the data properties from a Mongoose object */
export declare type ExtractData<T extends Definition> = DeepExtractObjProps<T[DefinitionField]>;

export type Extract<T> = T extends Record<DefinitionField, infer R>
  ? Convert<R>
  : never;
export type ExtractProps<T extends Definition> = DeepExtractObjProps<
  T[DefinitionField]
>;
export type ExtractFromReq<T> = { [P in keyof T]: DeepExtractFromReq<T[P]> };
export type ExtractDoc<T extends Definition> = T[DefinitionField] & Document;

// // This is our customization of the ts-mongoose DeepExtractProps<T> function
// // Change 1) - below ... ': T extends Types.ObjectId | string ? string'
// // This gives us a string for _id instead of (ObjectId & string) - since we use strings as Ids
// // Change 2) Add Partial wrappers around extracted subdocs and arrays of subdocs - uses Partial wrapper so that subdocuments won't require all properties
// // used above when type includes SubDocument
type DeepExtractProps<T> = T extends (
  | (infer R & SubDocument)
  | (infer R & SubDocumentNoId))
  ? R
  : T extends (
      | SubDocumentArray<infer R & SubDocument>
      | SubDocumentArrayNoId<infer R & SubDocumentNoId>)
  ? Array<Partial<{ [P in keyof DeepExtractObjProps<R>]: DeepExtractObjProps<R>[P];}>> // Added Partial
  : T extends Date
  ? Date
  : T extends Types.ObjectId | string // Added thisnpm run 
  ? string 
  : T extends Types.ObjectId
  ? Types.ObjectId
  : T extends Types.Decimal128
  ? Types.Decimal128
  : T extends {}
  ? Partial<{ [P in keyof DeepExtractObjProps<T>]: DeepExtractObjProps<T>[P]; }> // Added Partial
  : T;

type DeepExtractObjProps<T> = { [P in keyof T]: DeepExtractProps<T[P]> };

type DeepExtractFromReq<T> = 0 extends (1 & T) // any
  ? any
  : T extends (Date | Types.ObjectId | Types.Decimal128) // date or objectId
  ? string
  : T extends Array<infer R>
  ? Array<
      0 extends (1 & R) // any
        ? any
        : R extends (Date | Types.ObjectId) // date or objectId
        ? string
        : { [P in keyof ExtractFromReq<R>]: ExtractFromReq<R>[P] }
    >
  : T extends {}
  ? { [P in keyof ExtractFromReq<T>]: ExtractFromReq<T>[P] }
  : T;
