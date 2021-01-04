import { Model } from 'mongoose'
import {
  copyObject,
  createGuid,
  isNullOrEmpty,
  now,
  tryParseJSON,
  tryParseDate,
  flattenMongooseObject,
} from '../../../helpers'
import { Context } from '../../../models'
import { ObjectId } from '../../../models/data'

const DEFAULT_MONGO_TIMEOUT_FALLBACK = 10000

type HandleMongoErrorParams = {
  context: Context
  error: Error
  reject: any
  message?: string
}

const handleMongoError = ({ context, error, reject, message }: HandleMongoErrorParams) => {
  const { logger } = context
  const errorMessage = error || message
  logger?.log('MongoDB error', { errorMessage })
  reject(`MongoDB error: ${errorMessage}`)
}

export type MongoArgs = MongoArgFilter | MonoArgsOptions

export type MongoArgFilter = {
  [field: string]: any
}

export type MonoArgsOptions = {
  sort?: object
  limit?: number
  select?: number
  skip?: number
}

export type MongoSearchFields = {
  startsWith?: string[]
  wild?: string[]
}

type Result = {
  success: boolean
  modifiedCount: number
}

type ResultRecord<T> = {
  success: boolean
  modifiedCount: number
  _id?: string | ObjectId
  updatedItem?: T
}

type AggregateMongoArgs = {
  context: Context
  mongoObject: Model<any>
  aggregation: any[]
}

// TODO - Consider whether response from aggregateMongo can be strongly typed
export async function aggregateMongo({ context, mongoObject, aggregation }: AggregateMongoArgs): Promise<any> {
  const MONGO_TIMEOUT = context?.constants?.MONGO_TIMEOUT || DEFAULT_MONGO_TIMEOUT_FALLBACK
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => handleMongoTimeout(reject, MONGO_TIMEOUT), MONGO_TIMEOUT)
    mongoObject.aggregate(aggregation, (err: Error, result: any) => {
      clearTimeout(timeout)
      if (err) {
        handleMongoError({ context, error: err, reject })
      } else {
        resolve(result)
        clearTimeout(timeout)
      }
    })
  })
}

type DeleteMongoArgs = {
  context: Context
  filter: MongoArgFilter
  mongoObject: Model<any>
}

export async function deleteMongo<T>({ filter, context, mongoObject }: DeleteMongoArgs): Promise<Result> {
  const MONGO_TIMEOUT = context?.constants?.MONGO_TIMEOUT || DEFAULT_MONGO_TIMEOUT_FALLBACK
  // TODO: Limit by logged-in userId
  return new Promise((resolve, reject) => {
    const { argsOptions = {}, argsFiltered } = argsToMongoOptions(filter)
    const timeout = setTimeout(() => handleMongoTimeout(reject, MONGO_TIMEOUT), MONGO_TIMEOUT)
    mongoObject.findOneAndRemove(argsFiltered, (err: Error, result: any) => {
      clearTimeout(timeout)
      if (err) {
        handleMongoError({ context, error: err, reject })
      } else {
        if (result) {
          resolve({ success: true, modifiedCount: 1 })
        } else {
          resolve({ success: false, modifiedCount: 0 })
        }
        clearTimeout(timeout)
      }
    })
  })
}

export type FindMongoArgs = {
  context: Context
  filter: MongoArgFilter
  filterByLoggedInUserId?: boolean
  mongoObject: Model<any>
  searchableFields?: MongoSearchFields
  withCount?: boolean
}

/** returns an array of data object of type T (e.g. findMongo<UserData> => UserData[] ) */
export async function findMongo<T>({
  filter,
  context,
  mongoObject,
  searchableFields = null,
}: FindMongoArgs): Promise<T[]> {
  const MONGO_TIMEOUT = context?.constants?.MONGO_TIMEOUT || DEFAULT_MONGO_TIMEOUT_FALLBACK
  const { logger } = context
  return new Promise((resolve, reject) => {
    let { argsOptions, argsFiltered } = argsToMongoOptions(filter)
    argsFiltered = convertSelectedArgsToSearchableWildcards(argsFiltered, searchableFields) // convert some fields into wildcard searches
    argsOptions = argsOptions || {}
    logger?.trace('findMongo', { table: mongoObject.modelName, argsOptions, argsFiltered })
    const timeout = setTimeout(() => handleMongoTimeout(reject, MONGO_TIMEOUT), MONGO_TIMEOUT)
    mongoObject
      .find(argsFiltered)
      .select(argsOptions.select)
      .skip(argsOptions.skip)
      .limit(argsOptions.limit)
      .sort(argsOptions.sort) // example: { 'age' : -1, 'posts': 1 }    -- NOTE: Must include quotes around fields names and curly brackets around edge
      .then(data => {
        clearTimeout(timeout)
        resolve(data)
      })
      .catch((error: Error) => {
        clearTimeout(timeout)
        handleMongoError({ context, error, reject })
      })
  })
}

// TODO: Test - have not tested this function
/** Find matching records and count them as well
 *  Returns an array where the 1st item is an array of data elements and the 2nd is the count [data[], count] */
export async function findMongoWithCount<T>({
  filter,
  context,
  mongoObject,
  searchableFields = null,
}: FindMongoArgs): Promise<[T[], any]> {
  const MONGO_TIMEOUT = context?.constants?.MONGO_TIMEOUT || DEFAULT_MONGO_TIMEOUT_FALLBACK
  const { logger } = context
  const data: T[] = await findMongo<T>({ filter, context, mongoObject, searchableFields })

  return new Promise((resolve, reject) => {
    const { argsOptions, argsFiltered } = argsToMongoOptions(filter)
    const argsFilteredConverted = convertSelectedArgsToSearchableWildcards(argsFiltered, searchableFields) // convert some fields into wildcard searches
    logger?.trace('findMongoWCount', { table: mongoObject.modelName, argsOptions, argsFiltered: argsFilteredConverted })
    const timeout = setTimeout(() => handleMongoTimeout(reject, MONGO_TIMEOUT), MONGO_TIMEOUT)
    mongoObject
      .find(argsFilteredConverted)
      .count()
      .then(r => {
        clearTimeout(timeout)
        resolve([data, r])
      })
      .catch((error: Error) => {
        clearTimeout(timeout)
        handleMongoError({ context, error, reject })
      })
  })
}

export type CountMongoArgs = {
  filter: MongoArgFilter
  context: Context
  mongoObject: Model<any>
}

// use the ResultInt graphql type as the return type for this count
export async function countMongo({ filter, context, mongoObject }: CountMongoArgs): Promise<number> {
  const MONGO_TIMEOUT = context?.constants?.MONGO_TIMEOUT || DEFAULT_MONGO_TIMEOUT_FALLBACK
  const { logger } = context

  // TODO: Limit by logged-in userId
  return new Promise((resolve, reject) => {
    const { argsOptions, argsFiltered } = argsToMongoOptions(filter) // remove any non-fields
    const timeout = setTimeout(() => handleMongoTimeout(reject, MONGO_TIMEOUT), MONGO_TIMEOUT)
    mongoObject
      .count(argsFiltered)
      .then((data: number) => {
        clearTimeout(timeout)
        logger?.trace('countMongo:', { data })
        resolve(data)
        clearTimeout(timeout)
      })
      .catch((error: Error) => {
        clearTimeout(timeout)
        handleMongoError({ context, error, reject })
      })
  })
}

export type FindOneMongoArgs = {
  context: Context
  filter: MongoArgFilter
  filterByLoggedInUserId?: boolean
  mongoObject: Model<any>
  searchableFields?: MongoSearchFields
}

export async function findOneMongo<T>({
  context,
  mongoObject,
  filter,
  searchableFields = null,
  filterByLoggedInUserId = false,
}: FindOneMongoArgs): Promise<T> {
  const MONGO_TIMEOUT = context?.constants?.MONGO_TIMEOUT || DEFAULT_MONGO_TIMEOUT_FALLBACK
  const { logger } = context

  return new Promise((resolve, reject) => {
    const { argsOptions, argsFiltered } = argsToMongoOptions(filter) // trims options from args
    const argsFilteredConverted = convertSelectedArgsToSearchableWildcards(argsFiltered, searchableFields) // convert some fields into wildcard searches
    logger?.trace('findOneMongo', { table: mongoObject.modelName, argsOptions, argsFiltered: argsFilteredConverted })
    const timeout = setTimeout(() => handleMongoTimeout(reject, MONGO_TIMEOUT), MONGO_TIMEOUT)
    mongoObject
      .findOne(argsFilteredConverted)
      .select(argsOptions.select)
      .then(data => {
        clearTimeout(timeout)
        data = flattenMongooseObject(data)
        resolve(data as T)
        clearTimeout(timeout)
      })
      .catch(error => {
        clearTimeout(timeout)
        handleMongoError({ context, error, reject })
      })
  })
}

export type InMongoArgs = {
  context: Context
  mongoObject: Model<any>
  valuesArray: any[]
}

// find all records that have an _id that is present in the passed-in array
export async function inMongo<T>({ context, mongoObject, valuesArray }: InMongoArgs): Promise<T[]> {
  const MONGO_TIMEOUT = context?.constants?.MONGO_TIMEOUT || DEFAULT_MONGO_TIMEOUT_FALLBACK
  const { logger } = context

  // TODO: Limit by logged-in userId
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => handleMongoTimeout(reject, MONGO_TIMEOUT), MONGO_TIMEOUT)
    mongoObject
      .find()
      .in('_id', valuesArray)
      .then(data => {
        clearTimeout(timeout)
        logger?.trace('inMongo', { data })
        resolve(data)
        clearTimeout(timeout)
      })
      .catch((error: Error) => {
        clearTimeout(timeout)
        handleMongoError({ context, error, reject })
      })
  })
}

export type UpdateMongoArgs = {
  context: Context
  mongoObject: Model<any>
  newValues: any
  skipUpdatedFields?: boolean
  updatedBy?: string
}

export async function updateMongo({
  context,
  mongoObject,
  newValues,
  skipUpdatedFields = false,
  updatedBy = null,
}: UpdateMongoArgs): Promise<Result> {
  const MONGO_TIMEOUT = context?.constants?.MONGO_TIMEOUT || DEFAULT_MONGO_TIMEOUT_FALLBACK
  const { logger } = context
  const recordId = newValues._id
  delete newValues._id

  return new Promise((resolve, reject) => {
    if (!skipUpdatedFields) {
      newValues.updatedBy = updatedBy
      newValues.updatedOn = now()
    }
    const timeout = setTimeout(() => handleMongoTimeout(reject, MONGO_TIMEOUT), MONGO_TIMEOUT)
    logger?.trace('updateMongo new updated record', { newValues })
    mongoObject
      .update({ _id: recordId }, newValues, { multi: false })
      .then(response => {
        clearTimeout(timeout)
        resolve({ success: response.ok, modifiedCount: response.nModified })
        clearTimeout(timeout)
      })
      .catch((error: Error) => {
        logger?.error('There was an error updating the object (updateMongo)', error)
        handleMongoError({ context, error, reject })
      })
  })
}

export type UpsertMongoArgs<T> = {
  context: Context
  mongoObject: Model<T & any>
  newItem: T | any // todo: should be just T
  mergeFieldsWithExistingObject?: boolean
  returnUpdatedItem?: boolean
  skipUpdatedFields?: boolean
}

// Note: args are typed in-line because we need the T type
export async function upsertMongo<T>({
  context,
  mongoObject,
  newItem,
  returnUpdatedItem = false,
  mergeFieldsWithExistingObject = false,
  skipUpdatedFields = false,
}: UpsertMongoArgs<T>): Promise<ResultRecord<T>> {
  const MONGO_TIMEOUT = context?.constants?.MONGO_TIMEOUT || DEFAULT_MONGO_TIMEOUT_FALLBACK
  const { logger } = context

  return new Promise((resolve, reject) => {
    if (!newItem) {
      handleMongoError({
        context,
        error: null,
        reject,
        message: 'Error at upsertMongo : new object missing or not valid',
      })
    }
    if (!skipUpdatedFields) {
      newItem.updatedOn = now()
    }
    if (!newItem._id) {
      newItem.createdOn = now()
    }

    const timeout = setTimeout(() => handleMongoTimeout(reject, MONGO_TIMEOUT), MONGO_TIMEOUT)
    const recordToUpdateIdFilter = newItem._id ? { _id: newItem._id } : { _id: createGuid() } // if new record doesn't have an id, generate a guid

    const afterUpdate = (response: any) => {
      logger?.trace('upsertMongo new upserted record', { newItem })
      const newRecordId = response.upserted && response.upserted.length > 0 ? response.upserted[0]._id : null
      const returnVals: ResultRecord<T> = { success: response.ok, modifiedCount: response.nModified, _id: newRecordId }
      if (!returnUpdatedItem || returnVals.success !== response.ok) {
        return resolve(returnVals)
      }
      // get the updated row and add it to response (if requested)
      const lookupId = newRecordId || recordToUpdateIdFilter?._id
      findOneMongo<T>({
        context,
        mongoObject,
        filter: { _id: lookupId },
      })
        .then((updatedItem: T) => {
          clearTimeout(timeout)
          returnVals.updatedItem = updatedItem
          clearTimeout(timeout)
          return resolve(returnVals)
        })
        .catch((error: Error) => {
          clearTimeout(timeout)
          handleMongoError({ context, error, reject })
        })
      return null
    }

    // replaceOne replaces the existing record with the passed-in object
    // updateOne updates just the fields in the incoming object
    if (mergeFieldsWithExistingObject === false) {
      mongoObject
        .replaceOne(recordToUpdateIdFilter, newItem, { upsert: true, overwrite: true, new: true })
        .then(afterUpdate)
        .catch((error: Error) => {
          handleMongoError({ context, error, reject })
        })
    } else {
      mongoObject
        .updateOne(recordToUpdateIdFilter, newItem, { upsert: true, new: true })
        .then(afterUpdate)
        .catch((error: Error) => {
          handleMongoError({ context, error, reject })
        })
    }
  })
}

export function handleMongoTimeout(reject: any, timeout: number) {
  const errMsg = `MongoDB timeout when fetching from MongoDB (timeout is ${timeout}ms)`
  console.log(errMsg)
  reject(errMsg)
}

// This function limits mongo keywords that can be passed in args to: sort, limit, select, skip
// ...not all mongo options which are... ['tailable', 'sort', 'limit', 'skip', 'maxScan', 'maxTime','batchSize', 'comment', 'snapshot', 'hint', 'slaveOk', 'safe', 'collection']
export function argsToMongoOptions(args: MongoArgs): { argsOptions: MonoArgsOptions; argsFiltered: MongoArgFilter } {
  if (!args) {
    return { argsOptions: null, argsFiltered: null }
  }
  const argsFiltered: MongoArgs = copyObject(args)
  const { sort, limit, skip, select } = args

  const argsOptions: MonoArgsOptions = {
    sort: tryParseJSON(sort) || sort,
    limit: limit || null,
    select: select || null,
    skip: skip || 0,
  }

  if ('sort' in argsFiltered) delete argsFiltered.sort
  if ('limit' in argsFiltered) delete argsFiltered.limit
  if ('select' in argsFiltered) delete argsFiltered.select
  if ('skip' in argsFiltered) delete argsFiltered.skip

  return { argsOptions, argsFiltered }
}

export async function getIdsMatchingArgs<T>(
  args: MongoArgs,
  context: Context,
  modelType: Model<any>,
  selectFieldsClause = { _id: 1 },
): Promise<string[]> {
  return new Promise((resolve, reject) => {
    const newArgs = copyObject(args)
    Object.assign(newArgs, { select: selectFieldsClause }) // Only return the _id fields
    return findMongo<T>({ filter: newArgs, context, mongoObject: modelType })
      .then((results: T[]) => {
        const resultsIds = results.map((result: any) => result._id)
        resolve(resultsIds)
      })
      .catch((error: Error) => reject(error))
  })
}

// convert a start and end date string set to mongo argument
// update the params set as needed
export function convertArgsForDateParams(
  args: MongoArgs | any,
  dateParamName: string,
  dateStartParamName: string,
  dateEndParamName: string,
) {
  if (!args[dateStartParamName] && !args[dateEndParamName]) return args
  const startDate = Date.parse(args[dateStartParamName])
  const endDate = Date.parse(args[dateEndParamName])
  const dateArgs: { $lte?: number; $gte?: number } = {}
  if (startDate) {
    dateArgs.$gte = startDate
    delete args[dateStartParamName]
  }
  if (endDate) {
    dateArgs.$lte = endDate
    delete args[dateEndParamName]
  }

  if (!isNullOrEmpty(dateArgs)) {
    args[dateParamName] = dateArgs // e.g. {dateUpdate : {"$gte":"2017-06-30T11:11:00.000Z","$lte":"2017-07-02T11:11:00.000Z"}}
  }

  return args
}

// Create a date range parameter set using $gte and $lte
export function constructMongoDateRangeCondition(dateStart: any, dateEnd: any) {
  if (!dateStart && !dateEnd) return null
  const startDate = tryParseDate(dateStart)
  const endDate = tryParseDate(dateEnd)
  const dateArgs: { $lte?: Date; $gte?: Date } = {}
  if (startDate) {
    dateArgs.$gte = startDate
  }
  if (endDate) {
    dateArgs.$lte = endDate
  }

  return dateArgs // e.g.  {"$gte":"2017-06-30T11:11:00.000Z","$lte":"2017-07-02T11:11:00.000Z"}
}

// Converts arguments for a selected set of fields (searchFields)
// into wildcard enabled search values e.g. converts 'myname' into   {'$regex' : `^myname$`, '$options': 'i'}
// fields can limit search to start of field (startsWith) or anywhere in field (wild) Example: {startWith:['name'], wild:['description']}
// Returns the updated args
// Note: {startsWith:['name'], wild:['description']}
export function convertSelectedArgsToSearchableWildcards(args: MongoArgFilter, searchFields: MongoSearchFields) {
  if (isNullOrEmpty(searchFields)) {
    return args
  }
  const updatedArgs: { [key: string]: any } = copyObject(args)
  if (searchFields.startsWith) {
    searchFields.startsWith.forEach(field => {
      if (field in updatedArgs) {
        updatedArgs[field] = { $regex: `^${updatedArgs[field]}`, $options: 'i' }
      }
    })
  }
  if (searchFields.wild) {
    searchFields.wild.forEach(field => {
      if (field in updatedArgs) {
        updatedArgs[field] = { $regex: `${updatedArgs[field]}`, $options: 'i' }
      }
    })
  }

  return updatedArgs
}
