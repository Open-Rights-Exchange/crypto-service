import { NextFunction, Request, Response } from 'express'
import { globalLogger } from '../../../helpers/logger'
import { addAppIdToContextFromApiKey, createContext } from '../context'
import {
  assertBodyHasAtLeastOneOfValues,
  assertBodyHasOnlyOneOfValues,
  assertBodyhasRequiredValues,
  assertBodyValueIsArrayIfExists,
  assertHeaderhasRequiredValues,
  assertValidTransitPublicKeyAndRetrieve,
  extractEncryptedPayload,
  returnResponse,
  unwrapTransitEncryptedPasswordInSymOptions,
} from '../helpers'
import { Config, Context, ErrorSeverity, ErrorType, HttpStatusCode } from '../../../models'
import {
  decryptWithPasswordResolver,
  decryptWithPrivateKeysResolver,
  encryptResolver,
  generateKeysResolver,
  getTransitPublicKeyResolver,
  recoverAndReencryptResolver,
  signResolver,
  verifyPublicKeyResolver,
} from '../../resolvers/crypto'
import { logError, ServiceError } from '../../../helpers/errors'
import { StateStore } from '../../../helpers/stateStore'

// Root-level routes
async function v1Root(req: Request, res: Response, next: NextFunction, config: Config, state: StateStore) {
  const now = new Date()
  const { action } = req.params
  const context = createContext(req, config, now)
  try {
    await addAppIdToContextFromApiKey(req, context)
  } catch (error) {
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, null, error)
  }
  switch (action) {
    case 'decrypt-with-password':
      return handleDecryptWithPassword(req, res, next, context, state)
    case 'decrypt-with-private-keys':
      return handleDecryptWithPrivateKeys(req, res, next, context, state)
    case 'encrypt':
      return handleEncrypt(req, res, next, context, state)
    case 'generate-keys':
      return handleGenerateKeys(req, res, next, context, state)
    case 'get-transit-key':
      return handleGetTransitKey(req, res, next, context, state)
    case 'verify-public-key':
      return handleVerifyPublicKey(req, res, next, context, state)
    case 'recover-and-reencrypt':
      return handleRecoverAndReencrypt(req, res, next, context, state)
    case 'sign':
      return handleSign(req, res, next, context, state)
    default:
      return returnResponse(req, res, HttpStatusCode.NOT_FOUND_404, { errorMessage: 'Not a valid endpoint' }, context)
  }
}
// api/decrypt-with-password
/** Calls resolver to decrypt the payload using provided password and options */
export async function handleDecryptWithPassword(
  req: Request,
  res: Response,
  next: NextFunction,
  context: Context,
  state: StateStore,
) {
  const funcName = 'api/decrypt-with-password'
  try {
    globalLogger.trace('called handleDecryptWithPassword')
    assertHeaderhasRequiredValues(req, ['api-key', 'transit-public-key'], funcName)
    assertBodyhasRequiredValues(req, ['chainType', 'encrypted', 'symmetricOptions'], funcName)
    assertBodyValueIsArrayIfExists(req, ['returnAsymmetricOptions'], funcName)
    const { chainType, encrypted, returnAsymmetricOptions, symmetricOptions } = req.body

    const transitPublicKey = await assertValidTransitPublicKeyAndRetrieve(req, context, state)
    const password = symmetricOptions
      ? await unwrapTransitEncryptedPasswordInSymOptions(transitPublicKey, symmetricOptions, context, state)
      : null
    const response = await decryptWithPasswordResolver(
      { chainType, encrypted, password, symmetricOptions, returnAsymmetricOptions },
      context,
    )

    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

// api/decrypt-with-private-keys
/** Calls resolver to decrypt the payload using provided password and options */
export async function handleDecryptWithPrivateKeys(
  req: Request,
  res: Response,
  next: NextFunction,
  context: Context,
  state: StateStore,
) {
  const funcName = 'api/decrypt-with-private-keys'
  let asymmetricEncryptedPrivateKeys
  try {
    globalLogger.trace('called handleDecryptWithPrivateKeys')
    assertHeaderhasRequiredValues(req, ['api-key', 'transit-public-key'], funcName)
    assertBodyhasRequiredValues(req, ['chainType', 'encrypted'], funcName)
    assertBodyHasOnlyOneOfValues(
      req,
      ['asymmetricTransitEncryptedPrivateKeys', 'symmetricEncryptedPrivateKeys'],
      funcName,
    )
    assertBodyValueIsArrayIfExists(req, ['returnAsymmetricOptions'], funcName)
    const {
      chainType,
      encrypted,
      asymmetricTransitEncryptedPrivateKeys,
      symmetricEncryptedPrivateKeys,
      symmetricOptionsForEncryptedPrivateKeys,
      returnAsymmetricOptions,
    } = req.body

    const transitPublicKey = await assertValidTransitPublicKeyAndRetrieve(req, context, state)
    const password = symmetricEncryptedPrivateKeys
      ? await unwrapTransitEncryptedPasswordInSymOptions(
          transitPublicKey,
          symmetricOptionsForEncryptedPrivateKeys,
          context,
          state,
        )
      : null

    // extract asymmetricEncryptedPrivateKeys using transitPublicKey
    const encryptedKeys = await extractEncryptedPayload(
      transitPublicKey,
      asymmetricTransitEncryptedPrivateKeys,
      'asymmetricTransitEncryptedPrivateKeys',
      context,
      state,
    )
    asymmetricEncryptedPrivateKeys = encryptedKeys

    const response = await decryptWithPrivateKeysResolver(
      {
        chainType,
        encrypted,
        asymmetricEncryptedPrivateKeys,
        symmetricEncryptedPrivateKeys,
        symmetricOptionsForEncryptedPrivateKeys,
        returnAsymmetricOptions,
        password,
      },
      context,
    )

    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

// api/recover-and-reencrypt
/** Calls resolver to decrypt the payload using provided password and options */
export async function handleRecoverAndReencrypt(
  req: Request,
  res: Response,
  next: NextFunction,
  context: Context,
  state: StateStore,
) {
  const funcName = 'api/recover-and-reencrypt'
  let encryptedPayload
  let asymmetricEncryptedPrivateKeys
  let password
  try {
    globalLogger.trace('called handleRecoverAndReencrypt')
    assertHeaderhasRequiredValues(req, ['api-key', 'transit-public-key'], funcName)
    assertBodyhasRequiredValues(req, ['chainType', 'asymmetricTransitEncryptedPrivateKeys'], funcName)
    assertBodyHasOnlyOneOfValues(req, ['encrypted', 'encryptedTransitEncrypted'], funcName)
    assertBodyHasAtLeastOneOfValues(req, ['symmetricOptionsForReencrypt', 'asymmetricOptionsForReencrypt'], funcName)
    assertBodyValueIsArrayIfExists(req, ['asymmetricOptionsForReencrypt'], funcName)

    const {
      chainType,
      encrypted,
      encryptedTransitEncrypted,
      asymmetricTransitEncryptedPrivateKeys,
      symmetricOptionsForReencrypt,
      asymmetricOptionsForReencrypt,
    } = req.body

    const transitPublicKey = await assertValidTransitPublicKeyAndRetrieve(req, context, state)

    // extract encrypted payload from encryptedTransitEncrypted (if provided)
    if (encryptedTransitEncrypted) {
      encryptedPayload = await extractEncryptedPayload(
        transitPublicKey,
        encryptedTransitEncrypted,
        'encryptedTransitEncrypted',
        context,
        state,
      )
    } else {
      encryptedPayload = encrypted
    }

    // extract password (if provided in sym options)
    if (symmetricOptionsForReencrypt) {
      password = await unwrapTransitEncryptedPasswordInSymOptions(
        transitPublicKey,
        symmetricOptionsForReencrypt,
        context,
        state,
      )
    }

    // extract asymmetricEncryptedPrivateKeys
    asymmetricEncryptedPrivateKeys = await extractEncryptedPayload(
      transitPublicKey,
      asymmetricTransitEncryptedPrivateKeys,
      'asymmetricTransitEncryptedPrivateKeys',
      context,
      state,
    )

    const response = await recoverAndReencryptResolver(
      {
        chainType,
        encrypted: encryptedPayload,
        asymmetricEncryptedPrivateKeys,
        symmetricOptionsForReencrypt,
        asymmetricOptionsForReencrypt,
        password,
      },
      context,
    )

    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

// api/encrypt
/** Calls resolver to encrypt the payload using one or more public/private key pairs for a specific blockchain */
export async function handleEncrypt(
  req: Request,
  res: Response,
  next: NextFunction,
  context: Context,
  state: StateStore,
) {
  const funcName = 'api/encrypt'
  try {
    globalLogger.trace('called handleEncrypt')
    assertHeaderhasRequiredValues(req, ['api-key', 'transit-public-key'], funcName)
    assertBodyhasRequiredValues(req, ['chainType', 'toEncrypt'], funcName)
    assertBodyHasAtLeastOneOfValues(req, ['asymmetricOptions', 'symmetricOptions'], funcName)
    assertBodyValueIsArrayIfExists(req, ['asymmetricOptions'], funcName)
    const { asymmetricOptions, chainType, toEncrypt, symmetricOptions } = req.body

    const transitPublicKey = await assertValidTransitPublicKeyAndRetrieve(req, context, state)
    const password = symmetricOptions
      ? await unwrapTransitEncryptedPasswordInSymOptions(transitPublicKey, symmetricOptions, context, state)
      : null
    const response = await encryptResolver(
      { chainType, asymmetricOptions, symmetricOptions, password, toEncrypt },
      context,
    )

    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

// api/generate-keys
/** Calls resolver to generate one or more public/private key pairs for a specific blockchain */
export async function handleGenerateKeys(
  req: Request,
  res: Response,
  next: NextFunction,
  context: Context,
  state: StateStore,
) {
  const funcName = 'api/generate-keys'
  try {
    globalLogger.trace('called handleGenerateKeys')
    assertHeaderhasRequiredValues(req, ['api-key', 'transit-public-key'], funcName)
    assertBodyhasRequiredValues(req, ['chainType'], funcName)
    assertBodyHasAtLeastOneOfValues(req, ['asymmetricOptions', 'symmetricOptions'], funcName)
    assertBodyValueIsArrayIfExists(req, ['asymmetricOptions'], funcName)
    const { asymmetricOptions, chainType, keyCount, symmetricOptions } = req.body

    const transitPublicKey = await assertValidTransitPublicKeyAndRetrieve(req, context, state)
    const password = symmetricOptions
      ? await unwrapTransitEncryptedPasswordInSymOptions(transitPublicKey, symmetricOptions, context, state)
      : null
    const response = await generateKeysResolver(
      { chainType, keyCount, asymmetricOptions, symmetricOptions, password },
      context,
    )

    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

// api/sign
/** Calls resolver to sign a transaction with one or more private key pairs for a specific blockchain */
export async function handleSign(req: Request, res: Response, next: NextFunction, context: Context, state: StateStore) {
  const funcName = 'api/sign'
  try {
    globalLogger.trace('called handleSign')
    assertHeaderhasRequiredValues(req, ['api-key', 'transit-public-key'], funcName)
    assertBodyhasRequiredValues(req, ['chainType', 'toSign'], funcName)
    assertBodyHasAtLeastOneOfValues(
      req,
      ['asymmetricTransitEncryptedPrivateKeys', 'symmetricEncryptedPrivateKeys'],
      funcName,
    )
    assertBodyValueIsArrayIfExists(req, ['symmetricEncryptedPrivateKeys'], funcName)
    const {
      chainType,
      toSign,
      symmetricOptions,
      asymmetricTransitEncryptedPrivateKeys,
      symmetricEncryptedPrivateKeys,
    } = req.body

    const transitPublicKey = await assertValidTransitPublicKeyAndRetrieve(req, context, state)
    const password = symmetricOptions
      ? await unwrapTransitEncryptedPasswordInSymOptions(transitPublicKey, symmetricOptions, context, state)
      : null

    // extract asymmetricEncryptedPrivateKeys
    const asymmetricEncryptedPrivateKeys = await extractEncryptedPayload(
      transitPublicKey,
      asymmetricTransitEncryptedPrivateKeys,
      'asymmetricTransitEncryptedPrivateKeys',
      context,
      state,
    )

    if (asymmetricTransitEncryptedPrivateKeys && !Array.isArray(asymmetricEncryptedPrivateKeys)) {
      const msg = `Bad parameter(s) in request body. 'encrypted' param (within asymmetricTransitEncryptedPrivateKeys) must be an array. If only one value, enclose it in an array i.e. [ ].`
      throw new ServiceError(msg, ErrorType.BadParam, funcName)
    }

    const response = await signResolver(
      {
        chainType,
        password,
        toSign,
        symmetricOptions,
        asymmetricEncryptedPrivateKeys,
        symmetricEncryptedPrivateKeys,
      },
      context,
    )

    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

// api/get-transit-key
/** Returns a single use public key for caller to use to (asymmetrically) encrypt all data sent to this server */
export async function handleGetTransitKey(
  req: Request,
  res: Response,
  next: NextFunction,
  context: Context,
  state: StateStore,
) {
  const funcName = 'api/get-transit-key'
  try {
    globalLogger.trace('called handleGetTransitKey')
    assertBodyhasRequiredValues(req, ['nonce'], funcName)
    assertHeaderhasRequiredValues(req, ['api-key'], funcName)
    const { nonce } = req.body
    const response = await getTransitPublicKeyResolver({ nonce }, context, state)
    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

// api/public-key
/** Returns the public key for which all incoming secrets should be asymmetrically encrypted */
export async function handleVerifyPublicKey(
  req: Request,
  res: Response,
  next: NextFunction,
  context: Context,
  state: StateStore,
) {
  const funcName = 'api/verify-public-key'
  try {
    globalLogger.trace('called handlePublicKey')
    assertBodyhasRequiredValues(req, ['nonce'], funcName)
    assertHeaderhasRequiredValues(req, ['api-key'], funcName)
    const { nonce } = req.body
    const response = await verifyPublicKeyResolver({ nonce }, context)
    return returnResponse(req, res, HttpStatusCode.OK_200, response, context)
  } catch (error) {
    logError(context, error, ErrorSeverity.Info, funcName)
    return returnResponse(req, res, HttpStatusCode.BAD_REQUEST_400, null, context, error)
  }
}

export { v1Root }
