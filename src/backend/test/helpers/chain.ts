import { ChainFactory, ChainEosV2, Chain } from '@open-rights-exchange/chainjs'
import { ChainType } from '@open-rights-exchange/chainjs/dist/models'

declare let global: any

export const getChainJsKylin = async () => {
  const chain = new ChainFactory().create(ChainType.EosV2, [{ url: global.KYLIN_URL }], {
    unusedAccountPublicKey: global.UNUSED_ACCOUNT_PUBLIC_KEY,
  })
  await chain.connect()
  return chain
}

// Helper functions
export const prepTransactionFromActions = async (chain: Chain, transactionActions: any, key: string) => {
  const transaction = (chain as ChainEosV2).new.Transaction()
  transaction.actions = transactionActions
  await transaction.prepareToBeSigned()
  await transaction.validate()
  transaction.sign([key])
  return transaction
}

export const prepTransaction = async (chain: Chain, transaction: any, key: string) => {
  await transaction.prepareToBeSigned()
  await transaction.validate()
  transaction.sign([key])
  return transaction
}
