import {
  AsymmetricEncryptedString,
  ChainType,
  Context,
  EncryptParams,
  ErrorType,
  RecoverAndReencryptResolverParams,
  SymmetricEncryptedString,
} from '../../../models'
import { assertValidChainType, getChainTypeFromChainConnect, isNullOrEmpty, ServiceError } from '../../../helpers'
import { getChain } from '../../chains/chainConnection'
import {
  decryptPrivateKeys,
  decryptAsymmetrically,
  encryptAsymmetrically,
  encryptSymmetrically,
  mapAsymmetricOptionsParam,
  mapSymmetricOptionsParam,
} from './cryptoHelpers'
import { encryptResolver } from './encryptResolver'

/**
 *  Decrypts a symmetrically encrypted payload using a password (in the authToken)
 *  If returnAsymmetricOptions is specified, the decrypted item is encrypted with this public key before being returned
 *  Returns: the decrypted string OR an asymmetrically re-encrypted payload (using returnAsymmetricOptions)
 */
export async function recoverAndReencryptResolver(
  params: RecoverAndReencryptResolverParams,
  context: Context,
): Promise<{
  asymmetricEncryptedStrings?: AsymmetricEncryptedString[]
  symmetricEncryptedString?: SymmetricEncryptedString
}> {
  assertValidChainType(params?.chainType)
  const {
    chainType,
    encrypted,
    asymmetricEncryptedPrivateKeys,
    password,
    asymmetricOptionsForReencrypt,
    symmetricOptionsForReencrypt,
  } = params
  const chainConnect = await getChain(chainType, context)
  const chainConnectNoChain = await getChain(ChainType.NoChain, context)
  const { logger } = context
  let asymmetricEncryptedStrings: AsymmetricEncryptedString[]

  if (!isNullOrEmpty(symmetricOptionsForReencrypt) && isNullOrEmpty(password)) {
    const msg = `Password is required to re-encrypt.`
    throw new ServiceError(msg, ErrorType.BadParam, 'recoverAndReencryptResolver')
  }
  // extract encrypted asym keys (that are encrypted with service's base key)
  const privateKeys = await decryptPrivateKeys({
    asymmetricEncryptedPrivateKeys,
    chainConnect: chainConnectNoChain, // use NoChain so it wont expect public keys formatted for a specific chain - base public key is uncompressed
  })

  // Decrypt asymmetrically with private keys
  const decrypted = await decryptAsymmetrically(chainConnect, {
    encrypted,
    privateKeys,
  })

  // Reencrypt for return

  // Encrypt asym
  if (!isNullOrEmpty(asymmetricOptionsForReencrypt)) {
    const encryptParams: EncryptParams = {
      chainType: getChainTypeFromChainConnect(chainConnect),
      asymmetricOptions: asymmetricOptionsForReencrypt,
      toEncrypt: decrypted,
    }
    ;({ asymmetricEncryptedStrings } = await encryptResolver(encryptParams, context))
  }

  // Encrypt sym
  let symmetricEncryptedString: SymmetricEncryptedString
  if (!isNullOrEmpty(symmetricOptionsForReencrypt)) {
    const { symmetricEccOptions, symmetricEd25519Options, isEcc } = await mapSymmetricOptionsParam(
      symmetricOptionsForReencrypt,
      context,
    )
    const options = isEcc ? symmetricEccOptions : symmetricEd25519Options
    symmetricEncryptedString = await encryptSymmetrically(chainConnect, {
      unencrypted: decrypted,
      password,
      options,
    })
  }

  return { symmetricEncryptedString, asymmetricEncryptedStrings }
}
