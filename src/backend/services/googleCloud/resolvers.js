/* eslint-disable no-shadow */
/*
    Google cloud NodeJS storage client library docs - https://cloud.google.com/storage/docs/reference/libraries#client-libraries-install-nodejs
 */

import path from 'path'
import { now, stringifySafe } from 'aikon-js'

import { logger } from '../../utils/helpers'
import { createGoogleStorage } from './connectors'
import { GOOGLE_CLOUD_BUCKET } from '../../constants'
// import { Writable } from 'stream';
const read = require('read-all-stream')
const request = require('request')

const googleStorage = createGoogleStorage()
const googleStorageEndpoint = 'https://storage.googleapis.com'

// Lists files in the bucket
export async function listFilesInBucket(bucketName = GOOGLE_CLOUD_BUCKET) {
  const fileList = []
  try {
    const results = await googleStorage.bucket(bucketName).getFiles()
    const [files] = results
    files.forEach(file => {
      fileList.push(file.name)
    })
  } catch (error) {
    logger.logAndThrowError('Problem with googleStorage listFilesInBucket:', error)
  }
  return fileList
}

// list all blobs in a google storage "folder", e.g. "public/"
// path = filter files, e.g. "public/"
export async function listFiles(path, bucketName = GOOGLE_CLOUD_BUCKET) {
  /*
   * The delimiter argument can be used to restrict the results to only the
   * "files" in the given "folder". Without the delimiter, the entire tree under
   * the path is returned. For example, given these blobs:
   *   /a/1.txt or /a/b/2.txt
   *
   * If you just specify path = '/a', you'll get back:
   *   /a/1.txt or /a/b/2.txt
   *
   * However, if you specify path='/a' and delimiter='/', you'll get back:
   *   /a/1.txt
   */
  const options = {
    prefix: ensureSlash(path),
    delimiter: '/',
  }
  const fileList = []
  // Lists files in the bucket, filtered by a prefix
  try {
    const results = await googleStorage.bucket(bucketName).getFiles(options)
    const [files] = results
    files.forEach(file => {
      fileList.push(file.name)
    })
  } catch (error) {
    logger.logAndThrowError('Problem with googleStorage listFiles:', error)
  }
  return fileList
}

// creates and returns a new file stream
export function createFileWriteStream(path, filename = '', filetype, contentType, bucketName = GOOGLE_CLOUD_BUCKET) {
  const fileMetadata = contentType ? { metadata: { contentType, metadata: { custom: 'metadata' } } } : null
  let remoteWriteStream
  try {
    const bucket = googleStorage.bucket(bucketName)
    // create the stream
    const pathAndfilename = `${ensureSlash(path)}${filename}`
    remoteWriteStream = bucket.file(pathAndfilename).createWriteStream(fileMetadata)
    remoteWriteStream.on('error', error => {
      logger.error(
        `There was a problem writing to Google Cloud Store for pathAndfilename:${pathAndfilename} to google bucket:${bucketName}`,
        error,
      )
    })
  } catch (error) {
    logger.logAndThrowError(
      `\n\nThere was a problem creating a log write stream (createFileWriteStream) to Google Cloud Store: ${stringifySafe(
        error,
      )}\n\n`,
    )
  }
  return remoteWriteStream
}

// pipe from incoming stream to google cloud write stream
// Note: .pipe will close write stream when it reaches end of read stream
export async function uploadFileFromStream(
  stream,
  path,
  filename,
  filetype,
  contentType,
  bucketName = GOOGLE_CLOUD_BUCKET,
) {
  const remoteWriteStream = createFileWriteStream(path, filename, filetype, contentType, bucketName)
  // pipe the incoming stream to the output stream
  return new Promise((resolve, reject) => {
    stream
      .pipe(remoteWriteStream)
      .on('error', err => {
        reject(err)
      })
      .on('finish', () => {
        const fileUrl = `${googleStorageEndpoint}/${bucketName}/${path}${filename}`
        resolve(fileUrl)
      })
  })
}

// pipe from incoming stream to google cloud write stream
// Note: .pipe will close write stream when it reaches end of read stream
export async function uploadFileFromFileUrl(
  fileUrl,
  path,
  filename,
  filetype,
  contentType,
  bucketName = GOOGLE_CLOUD_BUCKET,
) {
  const remoteWriteStream = createFileWriteStream(path, filename, filetype, contentType, bucketName)
  // pipe the incoming stream to the output stream
  return new Promise((resolve, reject) => {
    request
      .get(fileUrl)
      .on('response', response => {
        if (response.statusCode === 404) {
          reject(new Error("Couldn't reach file url"))
        }
      })
      .pipe(remoteWriteStream)
      .on('error', err => {
        reject(err)
      })
      .on('finish', () => {
        const fileUrl = `${googleStorageEndpoint}/${bucketName}/${path}${filename}`
        resolve(fileUrl)
      })
  })
}

// create, write, and close filestream to google storage
// path = directory inside google storage bucket
// filename = resulting filename in bucket
export async function uploadFileFromContents(contents, path, filename, filetype, bucketName = GOOGLE_CLOUD_BUCKET) {
  const remoteWriteStream = createFileWriteStream(path, filename, filetype, bucketName)
  remoteWriteStream.write(contents) // google expects newline separated json objects.
  remoteWriteStream.end()
  const fileUrl = `${googleStorageEndpoint}/${bucketName}/${path}${filename}`
  return { fileUrl }
}

// Uploads a local file to the bucket
// filename = The name of the local file to upload, e.g. "./local/path/to/file.txt"
export async function uploadLocalFile(filename, destination, bucketName = GOOGLE_CLOUD_BUCKET) {
  let storedImageData
  try {
    const storedImage = await googleStorage
      .bucket(bucketName)
      .upload(path.resolve(__dirname, filename), { destination })
    ;[, storedImageData] = storedImage // get second item in array
  } catch (error) {
    logger.logAndThrowError('Problem with googleStorage uploadLocalFile:', error)
  }
  return storedImageData
}

// Downloads file
// srcFilename = The name of the remote file to download, e.g. "path/file.txt"
// destFilename = The local path to which the file should be downloaded, e.g. "./file.txt"
export async function downloadFile(srcFilename, destFilename, bucketName = GOOGLE_CLOUD_BUCKET) {
  const options = {
    destination: destFilename,
  }
  try {
    await googleStorage.bucket(bucketName).file(srcFilename).download(options)
    return true
  } catch (error) {
    logger.logAndThrowError('Problem with googleStorage downloadFile:', error)
  }
  return false
}

export async function readRemoteFileAsync(path, srcFilename, bucketName = GOOGLE_CLOUD_BUCKET) {
  try {
    const pathAndfilename = `${ensureSlash(path)}${srcFilename}`
    const bucket = googleStorage.bucket(bucketName)
    const remoteReadStream = bucket.file(pathAndfilename).createReadStream()
    return await read(remoteReadStream)
  } catch (error) {
    logger.logAndThrowError('Problem with googleStorage readRemoteFileAsync:', error)
  }
  return null
}

// Deletes the file from the bucket
// filename = The name of the file to delete, e.g. "file.txt"
export async function deleteFile(filename, bucketName = GOOGLE_CLOUD_BUCKET) {
  try {
    await googleStorage.bucket(bucketName).file(filename).delete()
    return true
  } catch (error) {
    logger.logAndThrowError('Problem with googleStorage deleteFile:', error)
  }
  return false
}

// filename = The name of the file to get metadata for, e.g. "file.txt"
export async function getMetadata(filename, bucketName = GOOGLE_CLOUD_BUCKET) {
  try {
    const results = await googleStorage.bucket(bucketName).file(filename).getMetadata()
    const [metadata] = results
    return metadata
  } catch (error) {
    logger.logAndThrowError('Problem with googleStorage getMetadata:', error)
  }
  return null
}

function ensureSlash(path) {
  if (path && path.length > 0 && path.slice(-1) !== '/') {
    path += '/'
  }
  return path
}

export function constructPathFromDate() {
  const d = now()
  const year = d.getUTCFullYear()
  const month = d.getUTCMonth() + 1 < 10 ? `0${d.getUTCMonth() + 1}` : d.getUTCMonth() + 1
  const day = d.getUTCDate() < 10 ? `0${d.getUTCDate()}` : d.getUTCDate()
  const timestamp = d.getTime()
  return `${year}/${month}/${day}`
}
