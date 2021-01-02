import { AsymmetricEncryptedString, Context, EncryptParams, SymmetricEncryptedString } from '../../../models'
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
  assertValidChainType(params?.chainType)
  const chainConnect = await getChain(params?.chainType, context)
  let asymmetricEncryptedString: AsymmetricEncryptedString
  let symmetricEncryptedString: SymmetricEncryptedString

  const { symmetricEccOptions, symmetricEd25519Options } = await mapSymmetricOptionsParam(
    params?.symmetricOptions,
    context,
  )
  const { publicKeys } = params?.asymmetricOptions || {}
  const shouldEncryptAsym = !isNullOrEmpty(publicKeys)
  const { password } = params
  const shouldEncryptSym = !isNullOrEmpty(password)

  // Encrypt symmetrically with password
  if (shouldEncryptSym) {
    const encryptedPrivateKey = await encryptSymmetrically(chainConnect, {
      unencrypted: params?.toEncrypt,
      password,
      options: symmetricEccOptions || symmetricEd25519Options,
    })
    symmetricEncryptedString = encryptedPrivateKey
  }
  // Encrypt asymmetrically with publicKey(s)
  if (shouldEncryptAsym) {
    const options = mapAsymmetricOptionsParam(params?.asymmetricOptions)
    const encryptedPrivateKey = await encryptAsymmetrically(chainConnect, {
      unencrypted: params?.toEncrypt,
      publicKeys,
      ...options,
    })
    asymmetricEncryptedString = encryptedPrivateKey
  }

  return { asymmetricEncryptedString, symmetricEncryptedString }
}
