import { NextFunction, Request, Response } from 'express'
import fs from 'fs'
import { returnResponse } from '../helpers'
import { Constants, HttpStatusCode } from '../../../models'

const someWelknownFile = fs.existsSync('./some-welknown-file.txt')
  ? fs.readFileSync('./some-welknown-file.txt', 'utf8')
  : ''

// Respond with any .well-known file types required - Examples: https://en.wikipedia.org/wiki/List_of_/.well-known/_services_offered_by_webservers
async function wellknown(filename: string, req: Request, res: Response, next: NextFunction, constants: Constants) {
  switch (filename) {
    case 'some-welknown-endpoint':
      return res.send(someWelknownFile)
    default:
      return returnResponse(req, res, HttpStatusCode.NOT_FOUND_404, { errorMessage: 'Not a valid endpoint' }, null)
  }
}

export { wellknown }
