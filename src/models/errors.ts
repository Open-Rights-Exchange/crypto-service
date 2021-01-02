export enum ErrorSeverity {
  Info = 'info',
  Critical = 'critical',
  Debug = 'debug',
}

export enum ErrorType {
  AppConfig = 'app_config',
  AuthTokenValidation = 'auth_token_validation',
  BadParam = 'api_bad_parameter',
  ChainConfig = 'chain_config',
  Internal = 'internal',
  KeyError = 'key_error',
  ParseError = 'parse_error',
}
