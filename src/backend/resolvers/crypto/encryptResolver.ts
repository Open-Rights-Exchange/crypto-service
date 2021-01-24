import { AsymmetricEncryptedString, Context, EncryptParams, ErrorType, SymmetricEncryptedString } from '../../../models'
import { ServiceError } from '../../../helpers/errors'
import { getChain } from '../../chains/chainConnection'
import { assertValidChainType, asyncForEach, isNullOrEmpty } from '../../../helpers'
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
  asymmetricEncryptedStrings: AsymmetricEncryptedString[]
}> {
  const { asymmetricOptions: asymmetricOptionsArray, chainType, password, symmetricOptions, toEncrypt } = params
  assertValidChainType(chainType)
  // TODO: confirm chainType matches chainType of asymm options publicKeysChainType (if provided) - otherwise assum to be same as chainType param
  const chainConnect = await getChain(chainType, context)
  const asymmetricEncryptedStrings: AsymmetricEncryptedString[] = []
  let symmetricEncryptedString: SymmetricEncryptedString

  if (!isNullOrEmpty(symmetricOptions) && isNullOrEmpty(password)) {
    const msg = `Password is required to encrypt.`
    throw new ServiceError(msg, ErrorType.BadParam, 'encryptResolver')
  }

  const { symmetricEccOptions, symmetricEd25519Options } = await mapSymmetricOptionsParam(symmetricOptions, context)

  // Encrypt symmetrically with password
  if (symmetricOptions) {
    symmetricEncryptedString = await encryptSymmetrically(chainConnect, {
      unencrypted: toEncrypt,
      password,
      options: symmetricEccOptions || symmetricEd25519Options,
    })
  }

  // Encrypt asymmetrically with publicKey(s)
  if (asymmetricOptionsArray) {
    await asyncForEach(asymmetricOptionsArray, async (asymmetricOptions: any) => {
      const options = mapAsymmetricOptionsParam(asymmetricOptions)
      const encryptedValue = await encryptAsymmetrically(chainConnect, {
        unencrypted: toEncrypt,
        publicKeys: asymmetricOptions?.publicKeys,
        ...options,
      })
      asymmetricEncryptedStrings.push(encryptedValue)
    })
  }

  return { asymmetricEncryptedStrings, symmetricEncryptedString }
}
