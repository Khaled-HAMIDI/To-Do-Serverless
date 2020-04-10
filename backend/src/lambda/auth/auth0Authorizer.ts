import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
//import Axios from 'axios' ..
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

const cert = `-----BEGIN CERTIFICATE-----
MIIDEzCCAfugAwIBAgIJOetjyNmo/s5gMA0GCSqGSIb3DQEBCwUAMCcxJTAjBgNV
BAMTHHVkYWdyYW0taGFiaWJhbGxhaC5hdXRoMC5jb20wHhcNMjAwMzA0MTkzNjU0
WhcNMzMxMTExMTkzNjU0WjAnMSUwIwYDVQQDExx1ZGFncmFtLWhhYmliYWxsYWgu
YXV0aDAuY29tMIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEAn+sit9gY
7fsfuZBHKR4ZBlDvYPLhzKF/irWp/bCStLiSv1Q638vCIeNhFO0aG/CfaaaXKHRB
4fR12Cjm6270WIqASXekqbSWAEh1laMekAFcESHQ3JrRGgMQ1cpDk915610S0Zje
wPNoYAB6WxZ1J3TXEy6aDbm/5qcDJ16kfK0gEmuE/W3n4mhb+zKdxFQkVrwvDaxf
jlZOv2JvPLlwkfGcpMaNCVm6JynMRDu7LkSHtEvGLYm8LNsW+7zg6T+UFyULIL6g
9kRdbyxck0iWG2HcL3h+A5FwYpYhH2HTQt0vJTjeQdjhxKJwkNk7CPaf/VMMCPn4
cgBvOmiJOGVxfwIDAQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBR8
dqVnwrgtmA/rpjHAGkRFyyBRtzAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQEL
BQADggEBAFbwRsKUJfMJ2fN20k0w7qxtWNpzDGJehkesXjTwgva5/2GLdzLrML7t
eJ15vmbgf+GcOHsuztfPnem4QdLToobjxj1GTBkXxHP/aoAxM6ERdrhVRCVuA0gI
KPyAO8ML2uex/pFWWJrY63mLxZjy4pRiYubclJ24i9bgtPPMu7eh1MAjWShyq6gm
CLgpj7eeODIihCHhvyiCwsPu5kjz4lLdiqNy++DcwR0vz+dcVxPqEanszsN7UDkW
B6qqgqdSo3Jyeb3bQvvzSBqZC57nk2ZVLQLvaIDWViTnpFfi+aTKAGP1NvPi+9Ny
4wBRAAunWP+Md/lKE1VoJy4P+sI2SFE=
-----END CERTIFICATE-----`

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await  verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

 async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  if(!jwt){
    throw new Error('invalid token')
  }

  try {
    //const response = await Axios.get(jwksUrl);
    //console.log(response);
    var verifedToken = verify(token,cert,{algorithms:['RS256']})

    logger.info('verfied toekn',verifedToken)
    return  verifedToken as JwtPayload
  } catch (error) {
    console.error(error);
    return undefined
  }
}

function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
