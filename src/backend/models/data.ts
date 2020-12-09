import { Lookup } from './general'

export * from '../services/mongo/models'

// These classes are the strongly typed equivalents of the Mongo schema

export type TimestampSchema = {
  createdOn: Date
  createdBy: string
  updatedOn: Date
  updatedBy: string
  __v: number
}

export type AppAccessToken = {
  _id: string
  appId: string
  expiresOn: Date
  metadata?: {
    newAccountPassword?: string
    currentAccountPassword?: string
    secrets?: {
      // type: AppTokenSecretType
      value: string
    }[]
  }
} & TimestampSchema
