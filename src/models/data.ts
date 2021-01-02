import { Lookup } from './general'

export * from '../backend/services/mongo/models'

// These classes are the strongly typed equivalents of the Mongo schema

export enum AppConfigType {
  Salt = 'salt',
}

export type TimestampSchema = {
  createdOn: Date
  createdBy: string
  updatedOn: Date
  updatedBy: string
  __v: number
}
