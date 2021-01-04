import { handleVerifyPublicKey } from '../../api/controllers/root'

declare let global: any

/**
 * Api Calls
 */

type GetPublicKeyInput = {
  apiKey?: string
  serviceKey?: string
  // input: {
  //   account: string
  // }
}

export const getPublicKey = async ({ apiKey = global.TEST_APP_API_KEY }: GetPublicKeyInput) => {
  const req: any = {
    url: `http://localhost:8080/api/publicKey`,
    // query: {
    //   account: input.account,
    // },
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
  }

  // Used to get the return value
  const jsonMock = jest.fn().mockImplementation(params => params)

  const res: any = {
    json: jest.fn(),
    status: jest.fn().mockImplementation(() => ({
      json: jsonMock,
    })),
  }

  // Returns the result passed into jsonMock
  return handleVerifyPublicKey(req, res, () => {})
}
