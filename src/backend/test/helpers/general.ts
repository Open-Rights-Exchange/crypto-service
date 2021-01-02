import { Api, JsonRpc } from 'eosjs'
import { TextDecoder, TextEncoder } from 'text-encoding'
import { JsSignatureProvider } from 'eosjs/dist/eosjs-jssig'
import { isNullOrEmpty } from '../../../helpers'

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
