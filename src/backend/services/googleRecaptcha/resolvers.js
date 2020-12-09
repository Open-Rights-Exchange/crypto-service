/*
    Google Recaptcha - https://www.google.com/recaptcha/intro/v3.html
 */
import axios from 'axios'
import querystring from 'querystring'
import { logger } from '../../utils/helpers'
import { RECAPTCHA_SERVER_KEY } from '../../constants'

// send token to google Recaptcha and return response as a stringified JSON object
export async function processRecaptchaTokenResolver(token) {
  // make sure the constant exists
  if (!RECAPTCHA_SERVER_KEY || RECAPTCHA_SERVER_KEY.length === 0) {
    logger.error('RECAPTCHA_SERVER_KEY not found in constants.')
    return null
  }

  // Google requires application/x-www-form-urlencoded
  const params = querystring.stringify({ secret: RECAPTCHA_SERVER_KEY, response: token })

  return axios.post('https://www.google.com/recaptcha/api/siteverify', params).then(response => response.data)
}
