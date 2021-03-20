import { Api, JsonRpc } from 'eosjs'
import { TextDecoder, TextEncoder } from 'text-encoding'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig'
import { Server } from 'http'
import { isNullOrEmpty } from '../../../helpers'
import { CONSTANTS } from '../config/constants'
import { createExpressServer } from '../../../server/createServer'
import { StateStore } from '../../../helpers/stateStore'

declare let global: any

/**
 * Utilities
 */
export const generateRandomNumber = () => {
  return Math.round(Math.random() * 210)
}

export const getKylinApi = (privateKey?: any) => {
  let signatureProvider: any
  if (!isNullOrEmpty(privateKey)) {
    signatureProvider = new JsSignatureProvider([privateKey])
  } else {
    signatureProvider = new JsSignatureProvider([])
  }

  const rpc = new JsonRpc('https://api-kylin.eosasia.one:443', { fetch })
  const api = new Api({
    rpc,
    signatureProvider,
    textDecoder: new TextDecoder(),
    textEncoder: new TextEncoder(),
  })

  return { api, rpc }
}

export async function createExpressServerForTest() {
  const settingTracingEnabled = false
  const config = { constants: CONSTANTS, settings: { tracingEnabled: settingTracingEnabled } }
  const state = new StateStore()
  const app = await createExpressServer(config, state)
  const server: Server = app.listen(global.TEST_EXPRESS_SERVER_PORT, () => {
    // console.log(`Test service listening on port ${global.TEST_EXPRESS_SERVER_PORT}`)
  })
  return server
}
