import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import { returnResponse } from '../helpers'
import { Config, HttpStatusCode } from '../../../models'
import { StateStore } from '../../../helpers/stateStore'

const someWelknownFile = fs.existsSync('./some-welknown-file.txt')
  ? fs.readFileSync('./some-welknown-file.txt', 'utf8')
  : ''

// Respond with any .well-known file types required - Examples: https://en.wikipedia.org/wiki/List_of_/.well-known/_services_offered_by_webservers
async function wellknown(
  filename: string,
  req: Request,
  res: Response,
  next: NextFunction,
  config: Config,
  state: StateStore,
) {
  switch (filename) {
    case 'some-welknown-endpoint':
      return res.send(someWelknownFile)
    default:
      return returnResponse(req, res, HttpStatusCode.NOT_FOUND_404, { errorMessage: 'Not a valid endpoint' }, null)
  }
}

export { wellknown }
