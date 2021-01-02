import {
  AsymmetricEncryptedString,
  ChainType,
  Context,
  RecoverAndReencryptResolverParams,
  SymmetricEncryptedString,
} from '../../../models'
import { assertValidChainType, isNullOrEmpty, ServiceError } from '../../../helpers'
import { getChain } from '../../chains/chainConnection'
import {
  decryptPrivateKeys,
  decryptAsymmetrically,
  encryptAsymmetrically,
  encryptSymmetrically,
  mapAsymmetricOptionsParam,
  mapSymmetricOptionsParam,
} from './cryptoHelpers'

/**
 *  Decrypts a symmetrically encrypted payload using a password (in the authToken)
 *  If returnAsymmetricOptions is specified, the decrypted item is encrypted with this public key before being returned
 *  Returns: the decrypted string OR an asymmetrically re-encrypted payload (using returnAsymmetricOptions)
 */
export async function recoverAndReencryptResolver(
  params: RecoverAndReencryptResolverParams,
  context: Context,
): Promise<{
  asymmetricEncryptedString?: AsymmetricEncryptedString
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
  let asymmetricEncryptedString: AsymmetricEncryptedString
  if (!isNullOrEmpty(asymmetricOptionsForReencrypt)) {
    const options = mapAsymmetricOptionsParam(asymmetricOptionsForReencrypt)
    asymmetricEncryptedString = await encryptAsymmetrically(chainConnect, {
      unencrypted: decrypted,
      publicKeys: asymmetricOptionsForReencrypt?.publicKeys,
      ...options,
    })
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

  return { symmetricEncryptedString, asymmetricEncryptedString }
}
