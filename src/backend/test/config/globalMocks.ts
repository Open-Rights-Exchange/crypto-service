// import { Transaction } from '@open-rights-exchange/chainjs'
// import { EosAccount } from '@open-rights-exchange/chainjs/dist/chains/eos_2/eosAccount'
// import { toEosEntityName } from '@open-rights-exchange/chainjs/dist/chains/eos_2/helpers'
// import { mapChainError } from '@open-rights-exchange/chainjs/dist/chains/eos_2/eosErrors'
// import * as eosTransactionModule from '@open-rights-exchange/chainjs/dist/chains/eos_2/eosTransaction'

// import { Mongo } from '../../services/mongo/models'
import { getRollbar } from '../../services/rollbar/connectors'
import { findOneMongo } from '../../services/mongo/resolvers'
import { EosModels } from '../../../models/chain'
import { globalLogger, Logger } from '../../../helpers'
import { Context } from '../../../models'

import { EosTransaction } from '../__mocks__/eosTransaction'
import { CONSTANTS } from './constants'
import { Analytics } from '../../services/segment/resolvers'

const processId = 'AUTOMATED_TEST_PROCESS_ID'

let rollbar = null // getRollbar(CONSTANTS)  Rollbar disabled for tests

export const ContextTest: Context = {
  processId,
  analytics: new Analytics(CONSTANTS.SEGMENT_WRITE_KEY, processId),
  logger: new Logger({ processId, rollbar, tracingEnabled: false }),
  constants: CONSTANTS // constants for test
}

// /**
//  * Mocks
//  *
//  * Only mocking for this file and can be overriden per test
//  */
// const sendTransaction = async (transaction: Transaction, waitForConfirm: ConfirmType = ConfirmType.After001) => {
//   await transaction.validate()
//   const { missingSignatures } = transaction
//   if (missingSignatures) {
//     logger.logAndThrowError(
//       `Can't Send Transaction - missing signature(s), Signatures missing:${missingSignatures}. Transaction: ${transaction.toJson()} `,
//     )
//   }

//   transaction.send = jest.fn().mockReturnValue({})
//   const response = await transaction.send(waitForConfirm)
//   logger.trace(`sendTransaction  transaction: ${JSON.stringify(transaction)} response: ${response}`)
//   return response
// }
