export enum ResponseCodes {
  BadRequest = 400,
  UnAuthorised = 401,
  Forbidden = 403,
  NotFound = 404,
  RequestTimeOutError = 408,
  ValidationError = 422,

  Redirect = 300,

  ServerError = 500,
  GatewayTimeOut = 502,
  ServerDown = 503,

  Success = 201,
}

export enum SocialLoginTypes {
  Google = 'Google',
}

export enum ResourceAccessType {
  Read = 'r',
  Write = 'w',
  Update = 'u',
  Delete = 'd',
}

export enum ResourceAccessLevels {
  All = 'All',
  Group = 'Group',
  User = 'User',
  None = 'None',
}

export enum OTPType {
  PHONE = 'PHONE',
  EMAIL = 'EMAIL',
  AUTHENTICATOR = 'AUTHENTICATOR',
}

export enum DeFaultRoles {
  OWNER = "OWNER",
  EDITOR = "EDITOR",
  VIEWER = "VIEWER"
}
