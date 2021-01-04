// import { Transaction } from '@open-rights-exchange/chainjs'
// import { EosAccount } from '@open-rights-exchange/chainjs/dist/chains/eos_2/eosAccount'
// import { toEosEntityName } from '@open-rights-exchange/chainjs/dist/chains/eos_2/helpers'
// import { mapChainError } from '@open-rights-exchange/chainjs/dist/chains/eos_2/eosErrors'
// import * as eosTransactionModule from '@open-rights-exchange/chainjs/dist/chains/eos_2/eosTransaction'

// import { Mongo } from '../../services/mongo/models'
import { getRollbar } from '../../services/rollbar/connectors'
import { findOneMongo } from '../../services/mongo/resolvers'
import { EosModels } from '../../../models/chain'
import { logger, Logger } from '../../../helpers'
import { Context } from '../../../models'

import { EosTransaction } from '../__mocks__/eosTransaction'
import { CONSTANTS } from './constants'

const processId = 'AUTOMATED_TEST_PROCESS_ID'

let rollbar = null // getRollbar(CONSTANTS)  Rollbar disabled for tests

export const ContextTest: Context = {
  processId,
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

// const replicatePermission = (permissionName: string, publicKey: string): any => {
//   return {
//     perm_name: permissionName,
//     parent: 'owner',
//     required_auth: {
//       threshold: 1,
//       keys: [
//         {
//           key: publicKey,
//           weight: 1,
//         },
//       ],
//       accounts: [],
//       waits: [],
//     },
//   }
// }

// async function load(accountName: EosModels.EosEntityName): Promise<void> {
//   let replicatedPermissions: any = []

//   try {
//     const wallet = await findOneMongo<any>({
//       context: ContextTest,
//       mongoObject: Mongo.WalletAccount,
//       filter: {
//         accountName,
//       },
//     })

//     if (!wallet) {
//       throw Error('')
//     }

//     // TODO: Add chainNetwork validation
//     const isVirtualAccount = wallet.accounts.find((account: any) => {
//       return account.permissions.find((perm: any) => accountName === perm.permissionName)
//     })

//     if (isVirtualAccount) {
//       throw Error()
//     }

//     // TODO: Check by chainNetwork
//     wallet.accounts.forEach((account: any) => {
//       account.permissions.map(({ permissionName, publicKey }: any) => {
//         replicatedPermissions.push(replicatePermission(permissionName, publicKey))
//       })
//     })
//   } catch (error) {
//     const chainError = mapChainError(error)
//     // if account doesn't exist on the chain - remap the chain error (db key error)
//     chainError.errorType = ChainErrorType.AccountDoesntExist
//     chainError.message = `problem fetching account:${accountName} from chain: ${chainError.message}`
//     throw chainError
//   }

//   this._account = {
//     account_name: accountName,
//     head_block_num: 92317049,
//     head_block_time: '2020-02-28T01:12:35.500',
//     privileged: false,
//     last_code_update: '1970-01-01T00:00:00.000',
//     created: '2019-09-10T23:09:37.000',
//     ram_quota: 5473,
//     net_weight: 10000,
//     cpu_weight: 10000,
//     net_limit: {
//       used: 737,
//       available: 352894,
//       max: 353631,
//     },
//     cpu_limit: {
//       used: 3703,
//       available: 126595,
//       max: 130298,
//     },
//     ram_usage: 2996,
//     permissions: [
//       // All created accounts default to this permission
//       {
//         perm_name: 'owner',
//         parent: '',
//         required_auth: {
//           threshold: 1,
//           keys: [
//             {
//               key: 'EOS6rREF94Hp2kfKoynP3NwnR3m8mqAw6R66c1zLEWJVSq1JZax8u',
//               weight: 1,
//             },
//           ],
//           accounts: [],
//           waits: [],
//         },
//       },
//       ...replicatedPermissions,
//     ],
//     total_resources: {
//       owner: accountName,
//       net_weight: '1.0000 EOS',
//       cpu_weight: '1.0000 EOS',
//       ram_bytes: 4073,
//     },
//     self_delegated_bandwidth: null,
//     refund_request: null,
//     voter_info: null,
//   }
// }

// // Mocks specific EosAccount methods from chainjs
// load.bind(EosAccount)
// jest.spyOn(EosAccount.prototype, 'load').mockImplementation(load)

// // Mocks entire EosTransaction class from chainjs
// ;(eosTransactionModule as any).EosTransaction = EosTransaction

// // Mocks these functions from the file
// const chainResolvers = jest.requireActual('../../services/chain/resolvers')
// chainResolvers.sendTransaction = sendTransaction
