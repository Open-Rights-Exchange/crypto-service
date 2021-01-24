import { AsymmetricEncryptedString, Context, EncryptParams, ErrorType, SymmetricEncryptedString } from '../../../models'
import { ServiceError } from '../../../helpers/errors'
import { getChain } from '../../chains/chainConnection'
import { assertValidChainType, isNullOrEmpty } from '../../../helpers'
import {
  encryptAsymmetrically,
  encryptSymmetrically,
  mapAsymmetricOptionsParam,
  mapSymmetricOptionsParam,
} from './cryptoHelpers'

/**
 *  Encrypts a string using symmetric and/or asymmetric encryption
 *  Returns: an array of symmetrically and/or asymmetrically encrypted items
 */
export async function encryptResolver(
  params: EncryptParams,
  context: Context,
): Promise<{
  symmetricEncryptedString: SymmetricEncryptedString
  asymmetricEncryptedString: AsymmetricEncryptedString
}> {
  const { asymmetricOptions, chainType, password, symmetricOptions, toEncrypt } = params
  assertValidChainType(chainType)
  const chainConnect = await getChain(chainType, context)
  let asymmetricEncryptedString: AsymmetricEncryptedString
  let symmetricEncryptedString: SymmetricEncryptedString

  if (!isNullOrEmpty(symmetricOptions) && isNullOrEmpty(password)) {
    const msg = `Password is required to encrypt.`
    throw new ServiceError(msg, ErrorType.BadParam, 'encryptResolver')
  }

  const { symmetricEccOptions, symmetricEd25519Options } = await mapSymmetricOptionsParam(symmetricOptions, context)
  const { publicKeys } = asymmetricOptions || {}
  const shouldEncryptAsym = !isNullOrEmpty(publicKeys)
  const shouldEncryptSym = !isNullOrEmpty(password)

  // Encrypt symmetrically with password
  if (shouldEncryptSym) {
    const encryptedPrivateKey = await encryptSymmetrically(chainConnect, {
      unencrypted: toEncrypt,
      password,
      options: symmetricEccOptions || symmetricEd25519Options,
    })
    symmetricEncryptedString = encryptedPrivateKey
  }
  // Encrypt asymmetrically with publicKey(s)
  if (shouldEncryptAsym) {
    const options = mapAsymmetricOptionsParam(asymmetricOptions)
    const encryptedPrivateKey = await encryptAsymmetrically(chainConnect, {
      unencrypted: toEncrypt,
      publicKeys,
      ...options,
    })
    asymmetricEncryptedString = encryptedPrivateKey
  }

  return { asymmetricEncryptedString, symmetricEncryptedString }
}
