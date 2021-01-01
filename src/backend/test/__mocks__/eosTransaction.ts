import { hexToUint8Array } from 'eosjs/dist/eosjs-serialize'
import { isAString, isAnObject, isNullOrEmpty } from 'aikon-js'
import { Transaction } from '@open-rights-exchange/chainjs'
import { EosAccount } from '@open-rights-exchange/chainjs/dist/chains/eos_2/eosAccount'
import { getUniqueValues } from '@open-rights-exchange/chainjs/dist/helpers'
import {
  isValidEosSignature,
  isValidEosPrivateKey,
  toEosPublicKey,
} from '@open-rights-exchange/chainjs/dist/chains/eos_2/helpers'
import {
  getPublicKeyFromSignature,
  sign as cryptoSign,
} from '@open-rights-exchange/chainjs/dist/chains/eos_2/eosCrypto'
import {
  DEFAULT_TRANSACTION_BLOCKS_BEHIND_REF_BLOCK,
  DEFAULT_TRANSACTION_EXPIRY_IN_SECONDS,
} from '@open-rights-exchange/chainjs/dist/chains/eos_2/eosConstants'

import { EosModels } from '../../models/chain'

const throwNewError = (error: any) => {
  throw Error(error)
}

const throwAndLogError = (error: any) => {
  console.error(error)
  throw Error(error)
}

export type PublicKeyMapCache = {
  accountName: EosModels.EosEntityName
  permissionName: EosModels.EosEntityName
  publicKey: EosModels.EosPublicKey
}

/** Specifies how many block confirmations should be received before considering transaction is complete */
enum ConfirmType {
  /** Don't wait for any block confirmations */
  None = 0,
  /** After first block */
  After001 = 1,
}

export class EosTransaction {
  private _publicKeyMap: PublicKeyMapCache[] = []

  private _cachedAccounts: EosAccount[] = []

  private _actions: EosModels.EosActionStruct[]

  private _chainState: any

  private _header: any

  private _options: any

  private _signatures: Set<EosModels.EosSignature> // A set keeps only unique values

  /** Transaction prepared for signing (raw transaction) */
  private _raw: Uint8Array

  private _sendReceipt: any

  private _signBuffer: Buffer

  private _requiredAuthorizations: EosModels.EosAuthorization[]

  private _isValidated: boolean

  private _isMultiSig: boolean

  constructor(chainState: any, options?: any) {
    this._chainState = chainState
    let { blocksBehind, expireSeconds } = options || {}
    blocksBehind = blocksBehind ?? DEFAULT_TRANSACTION_BLOCKS_BEHIND_REF_BLOCK
    expireSeconds = expireSeconds ?? DEFAULT_TRANSACTION_EXPIRY_IN_SECONDS
    this._options = { blocksBehind, expireSeconds }
  }

  // header

  /** The header that is included when the transaction is sent to the chain
   *  It is part of the transaction body (in the signBuffer) which is signed
   *  The header changes every time prepareToBeSigned() is called since it includes latest block time, etc.
   */
  get header() {
    return this._header
  }

  /** The options provided when the transaction class was created */
  get options() {
    return this._options
  }

  /** The transaction body in raw format (by prepareForSigning) */
  get raw() {
    if (!this.hasRaw) {
      throwNewError(
        'Transaction has not been prepared to be signed yet. Call prepareToBeSigned() or use setFromRaw(). Use transaction.hasRaw to check before using transaction.raw',
      )
    }
    return this._raw
  }

  /** Whether the raw transaction has been prepared */
  get hasRaw(): boolean {
    return !!this._raw
  }

  get sendReceipt() {
    return this._sendReceipt
  }

  get isMultiSig(): boolean {
    return this._isMultiSig
  }

  get supportsMultisigTransaction(): boolean {
    return false
  }

  get transactionId(): string {
    return 'dummytxid'
  }

  /** Generate the raw transaction body using the actions attached
   *  Also adds a header to the transaction that is included when transaction is signed
   */
  public async prepareToBeSigned(): Promise<void> {
    this.assertIsConnected()
    // if prepared (raw) transaction already exists, then dont do it again
    if (this._raw) {
      return
    }
    this.assertNoSignatures()
    if (!this._actions) {
      throwNewError('Transaction serialization failure. Transaction has no actions.')
    }
    const { blocksBehind, expireSeconds } = this._options
    const transactOptions = { broadcast: false, sign: false, blocksBehind, expireSeconds }
    const { serializedTransaction: rawTransaction } = await this._chainState.api.transact(
      { actions: this._actions },
      transactOptions,
    )
    this._raw = this.rawToUint8Array(rawTransaction)
    this.setHeaderFromRaw(rawTransaction)
    this.setSignBuffer()
  }

  /** Extract header from raw transaction body (eosjs refers to raw as serialized) */
  private setHeaderFromRaw(rawTransaction: Uint8Array): void {
    // deserializeTransaction does not call the chain - just deserializes transation header and action names (not action data)
    const deRawified = this._chainState.api.deserializeTransaction(rawTransaction)
    delete deRawified.actions // remove parially deRawified actions
    this._header = deRawified
  }

  /** Set the body of the transaction using Hex raw transaction data
   *  This is one of the ways to set the actions for the transaction
   *  Sets transaction data from raw transaction - supports both raw/serialized formats (JSON bytes array and hex)
   *  This is an ASYNC call since it fetches (cached) action contract schema from chain in order to deserialize action data */
  async setFromRaw(raw: any): Promise<void> {
    this.assertIsConnected()
    this.assertNoSignatures()
    if (raw) {
      // if raw is passed-in as a JSON array of bytes, convert it to Uint8Array
      const useRaw = this.rawToUint8Array(raw)
      const { actions: txActions, deRawifiedTransaction: txHeader } = await this.deRawifyWithActions(useRaw)
      this._header = txHeader
      this._actions = txActions
      this._raw = useRaw
      this._isValidated = false
      this.setSignBuffer()
    }
  }

  /** Creates a sign buffer using raw transaction body */
  private setSignBuffer() {
    this.assertIsConnected()
    this._signBuffer = Buffer.concat([
      Buffer.from(this._chainState?.chainId, 'hex'),
      Buffer.from(this._raw),
      Buffer.from(new Uint8Array(32)),
    ])
  }

  /** Deserializes the transaction header and actions - fetches from the chain to deserialize action data */
  private async deRawifyWithActions(rawTransaction: Uint8Array | string): Promise<any> {
    this.assertIsConnected()
    const { actions, ...deRawifiedTransaction } = await this._chainState.api.deserializeTransactionWithActions(
      rawTransaction,
    )
    return { actions, deRawifiedTransaction }
  }

  // actions

  /** The contract actions executed by the transaction */
  public get actions() {
    return this._actions
  }

  /** Sets the Array of actions */
  public set actions(actions: EosModels.EosActionStruct[]) {
    this.assertNoSignatures()
    if (isNullOrEmpty(actions) || !Array.isArray(actions)) {
      throwNewError('actions must be an array and have at least one value')
    }
    this._actions = actions
    this._isValidated = false
  }

  /** Add one action to the transaction body
   *  Setting asFirstAction = true places the new transaction at the top */
  public addAction(action: EosModels.EosActionStruct, asFirstAction = false): void {
    this.assertNoSignatures()
    if (!action) {
      throwNewError('Action parameter is missing')
    }
    let newActions = this._actions ?? []
    if (asFirstAction) {
      newActions = [action, ...(this._actions || [])]
    } else {
      newActions.push(action)
    }
    this._actions = newActions
  }

  // validation

  /** Verifies that all accounts and permisison for actions exist on chain.
   *  Throws if any problems */
  public async validate(): Promise<void> {
    if (!this.hasRaw) {
      throwNewError(
        'Transaction validation failure. Missing raw transaction. Use setFromRaw() or if setting actions, call transaction.prepareToBeSigned().',
      )
    }

    // this will throw an error if an account in transaction body doesn't exist on chain
    this._requiredAuthorizations = await this.fetchAuthorizationsRequired()
    this._isValidated = true
  }

  // ** Whether transaction has been validated - via vaidate() */
  get isValidated() {
    return this._isValidated
  }

  /** Throws if not validated */
  private assertIsValidated(): void {
    this.assertIsConnected()
    if (!this._isValidated) {
      throwNewError('Transaction not validated. Call transaction.validate() first.')
    }
  }

  // signatures
  /** Signatures attached to transaction */
  get signatures(): EosModels.EosSignature[] {
    if (isNullOrEmpty(this._signatures)) return null
    return [...this._signatures]
  }

  /** Sets the Set of signatures */
  set signatures(signatures: EosModels.EosSignature[]) {
    signatures.forEach(sig => {
      this.assertValidSignature(sig)
    })
    this._signatures = new Set<EosModels.EosSignature>(signatures)
  }

  /** Add a signature to the set of attached signatures. Automatically de-duplicates values. */
  addSignatures(signatures: EosModels.EosSignature[]): void {
    if (isNullOrEmpty(signatures)) return
    signatures.forEach(signature => {
      this.assertValidSignature(signature)
    })
    const newSignatures = new Set<EosModels.EosSignature>()
    signatures.forEach(signature => {
      newSignatures.add(signature)
    })
    // add to existing collection of signatures
    this._signatures = new Set<EosModels.EosSignature>([...(this._signatures || []), ...newSignatures])
  }

  /** Throws if signatures isn't properly formatted */
  private assertValidSignature = (signature: EosModels.EosSignature) => {
    if (!isValidEosSignature(signature)) {
      throwAndLogError(`Not a valid signature : ${signature}`)
    }
  }

  /** Throws if any signatures are attached */
  private assertNoSignatures() {
    if (this.hasAnySignatures) {
      throwNewError(
        'You cant modify the body of the transaction without invalidating the existing signatures. Remove the signatures first.',
      )
    }
  }

  /** Whether there are any signatures attached */
  get hasAnySignatures(): boolean {
    return !isNullOrEmpty(this.signatures)
  }

  // TODO: Fix this logic - should evaluate the weights of keys in each EOSAuthorization
  // As written, the assumption is that if a public key is in the auth, it is required, but no neccesarily - if the threshold is already met with existing keys
  /** Whether there is an attached signature for every authorization (e.g. account/permission) in all actions */
  public get hasAllRequiredSignatures(): boolean {
    this.assertIsValidated()
    const hasAllSignatures = this._requiredAuthorizations?.every(auth => this.hasSignatureForPublicKey(auth.publicKey))
    return hasAllSignatures
  }

  /** Throws if transaction is missing any signatures */
  private assertHasAllRequiredSignature(): void {
    if (!this.hasAllRequiredSignatures) {
      throwNewError('Missing at least one required Signature')
    }
  }

  /** An array of authorizations (e.g. account/permission) that do not have an attached signature
   *  Retuns null if no signatures are missing */
  public get missingSignatures(): EosModels.EosAuthorization[] {
    this.assertIsValidated()
    const missing = this._requiredAuthorizations?.filter(auth => !this.hasSignatureForPublicKey(auth.publicKey))
    return isNullOrEmpty(missing) ? null : missing // if no values, return null instead of empty array
  }

  /** Whether there is an attached signature for the provided publicKey */
  public hasSignatureForPublicKey(publicKey: EosModels.EosPublicKey): boolean {
    const sigsToLoop = this.signatures || []
    return sigsToLoop.some(signature => {
      const pk = getPublicKeyFromSignature(signature, this._signBuffer)
      return pk === publicKey
    })
  }

  /** Whether there is an attached signature for the publicKey for the authoization (e.g. account/permission)
   *  May need to call chain (async) to fetch publicKey(s) for authorization(s) */
  public async hasSignatureForAuthorization(authorization: EosModels.EosAuthorization): Promise<boolean> {
    const { account, permission } = authorization
    let { publicKey } = authorization
    if (!authorization.publicKey) {
      publicKey = await this.getPublicKeyForAuthorization(account, permission)
    }
    return this.hasSignatureForPublicKey(publicKey)
  }

  /** The transaction data needed to create a transaction signature.
   *  It should be signed with a private key. */
  public get signBuffer(): Buffer {
    this.assertIsValidated()
    this.assertHasAllRequiredSignature()
    return this._signBuffer
  }

  /** Sign the transaction body with private key(s) and add to attached signatures */
  public sign(privateKeys: EosModels.EosPrivateKey[]): Promise<void> {
    this.assertIsValidated()
    if (isNullOrEmpty(privateKeys)) return
    privateKeys.forEach(pk => {
      if (!isValidEosPrivateKey) {
        throwNewError(`Sign Transaction Failure - Private key :${pk} is not valid EOS private key`)
      }
    })
    // sign the signBuffer using the private key
    privateKeys.forEach(pk => {
      const signature = cryptoSign(this._signBuffer, pk)
      this.addSignatures([signature])
    })
  }

  // authorizations

  /** An array of the unique set of account/permission/publicKey for all actions in transaction
   *  Also fetches the related accounts from the chain (to get public keys) */
  get requiredAuthorizations() {
    this.assertIsValidated()
    return this._requiredAuthorizations
  }

  /** Collect unique set of account/permission for all actions in transaction
   * Retrieves public keys from the chain by retrieving account(s) when needed */
  private async fetchAuthorizationsRequired(): Promise<EosModels.EosAuthorization[]> {
    const requiredAuths = new Set<EosModels.EosAuthorization>()
    const actions = this._actions
    if (actions) {
      actions
        .map(action => action.authorization)
        .forEach(auths => {
          auths.forEach(auth => {
            const { actor: account, permission } = auth
            requiredAuths.add({ account, permission })
          })
        })
    }
    // get the unique set of account/permissions
    const requiredAuthsArray = getUniqueValues<EosModels.EosAuthorization>(Array.from(requiredAuths))
    // attach public keys for each account/permission - fetches accounts from chain where necessary
    return this.addPublicKeysToAuths(requiredAuthsArray)
  }

  // TODO: This code only works if the firstPublicKey is the only required Key
  // ... this function and hasSignatureForAuthorization must be rewritten to look for weights
  // ... and the publicKeyCache approach needs to handle multiple keys per permission
  /** Fetch the public key (from the chain) for the provided account and permission
   *  Also caches permission/publicKey mappings - the cache can be set externally via appendPublicKeyCache
   */
  private async getPublicKeyForAuthorization(
    accountName: EosModels.EosEntityName,
    permissionName: EosModels.EosEntityName,
  ) {
    let publicKey
    const cachedPublicKey = (
      this._publicKeyMap.find(m => m.accountName === accountName && m.permissionName === permissionName) || {}
    ).publicKey

    const isNestedPermission = this.actions.find(action =>
      action.authorization.find(
        auth =>
          auth.actor === ('oreidfunding' as any) &&
          auth.permission !== ('oreidfunding' as any) &&
          auth.permission.includes('ore'),
      ),
    )

    if (cachedPublicKey) {
      publicKey = toEosPublicKey(cachedPublicKey)
    } else {
      const account = await this.getAccount(accountName)
      let permission = account?.permissions.find(p => p.name === permissionName)

      if (accountName === ('oreidfunding' as any) && isNestedPermission && isNestedPermission.name === 'hi') {
        permission = account.permissions.find(perm => perm.name === ('nestedperm' as any))
      }

      if (!permission?.firstPublicKey) {
        throwNewError(`Account ${accountName} doesn't have a permission named ${permissionName}.`)
      }
      publicKey = toEosPublicKey(permission?.firstPublicKey)
      // save key to map cache
      this.appendPublicKeyCache([{ accountName, permissionName, publicKey }])
    }
    return publicKey
  }

  /** Fetches account names from the chain (and adds to private cache) */
  private async getAccount(accountName: EosModels.EosEntityName) {
    let account = this._cachedAccounts.find(ca => accountName === ca.name)
    if (!account) {
      account = new EosAccount(this._chainState)
      await account.load(accountName)
      this._cachedAccounts.push(account)
    }
    return account
  }

  /** Use an already fetched account instead of trying to refect from the chain
   *  Can improve performance
   *  Also neccessary for creating an inline transaction for an new account which isnt yet on the chain */
  async appendAccountToCache(account: EosAccount) {
    this._cachedAccounts.push(account)
  }

  /** Use an already fetched map of account/permission to public keys
   *  Can improve performance - otherwise this class needs to retrieve accounts from the chain
   *  Also neccessary for creating a new account which isnt yet on the chain */
  appendPublicKeyCache(publicKeysMap: PublicKeyMapCache[]): void {
    this._publicKeyMap = [...this._publicKeyMap, ...publicKeysMap]
  }

  /** Fetches public keys (from the chain) for each account/permission pair
   *   Fetches accounts from the chain (if not already cached)
   */
  private async addPublicKeysToAuths(auths: EosModels.EosAuthorization[]) {
    const returnedAuth: EosModels.EosAuthorization[] = []

    const keysToGet = auths.map(async auth => {
      const publicKey = await this.getPublicKeyForAuthorization(auth.account, auth.permission)
      returnedAuth.push({ ...auth, publicKey })
    })
    await Promise.all(keysToGet)
    return returnedAuth
  }

  // send
  /** Broadcast a signed transaction to the chain
   *  waitForConfirm specifies whether to wait for a transaction to appear in a block (or irreversable block) before returning */
  public async send(waitForConfirm: ConfirmType = ConfirmType.None): Promise<any> {
    this.assertIsValidated()
    this.assertHasAllRequiredSignature()
    this._sendReceipt = this._chainState.sendTransaction(this._raw, this.signatures, waitForConfirm)
    return this._sendReceipt
  }

  // helpers

  /** Throws if not yet connected to chain - via chain.connect() */
  private assertIsConnected(): void {
    if (!this._chainState?.isConnected) {
      throwNewError('Not connected to chain')
    }
  }

  /** JSON representation of transaction data */
  public toJson(): any {
    return { ...this._header, actions: this._actions, signatures: this.signatures }
  }

  /** Accepts either an object where each value is the uint8 array value
   *     ex: {'0': 24, ... '3': 93 } => [24,241,213,93]
   *  OR a packed transaction as a string of hex bytes
   * */
  private rawToUint8Array = (rawTransaction: any): Uint8Array => {
    // if the trasaction data is a JSON array of bytes, convert to Uint8Array
    if (isAnObject(rawTransaction)) {
      const trxLength = Object.keys(rawTransaction).length
      let buf = new Uint8Array(trxLength)
      buf = Object.values(rawTransaction) as any // should be a Uint8Array in this value
      return buf
    }
    // if transaction is a packed transaction (string of bytes), convert it into an Uint8Array of bytes
    if (rawTransaction && isAString(rawTransaction)) {
      const deRawifiedTransaction = hexToUint8Array(rawTransaction)
      return deRawifiedTransaction
    }
    throw Error('Missing or malformed rawTransaction (rawToUint8Array)')
  }

  // ------------------------ EOS Specific functionality -------------------------------
  // Put any EOS chain specific feature that aren't included in the standard Transaction interface below here  */
  // calling code can access these functions by first casting the generic object into an eos-specific flavor
  // e.g.   let eosTransaction = (transaction as EosTransaction);
  //        eosTransaction.anyEosSpecificFunction();

  /** Placeholder */
  public anyEosSpecificFunction = () => {}
}
