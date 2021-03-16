import { AuthToken } from '../../../models'

// to create encodedToken1...
// const body: any = { chainType: 'ethereum', symmetricOptions: { salt: 'my-salt', iter: 50000 } }
// const testAutToken = await createAuthToken( 'http://localhost:8080/sign', body, servicePublicKey, { password: 'my-secure-password' }, false, new Date('2021-01-04T05:31:39.208Z'), new Date('2021-01-04T05:33:39.208Z') )

export const encodedToken1 =
  'eyJpdiI6bnVsbCwicHVibGljS2V5IjoiMDRjZWEyYzk1MTUwNGI1YmZlZmE3ODQ4MGFlNjMyZGEyYzc4ODk1NjEzMjVmOWQ3NmNhN2IwYTFlNjJmN2E4Y2Q1MmNlMzEzYzhiM2ZkM2M3ZmZlMmY1ODgzMjJlNWJlMzMxYzY0YjMxYjI1NmE4NzY5ZTkyZjk0N2FlNzEyYjc2MSIsImVwaGVtUHVibGljS2V5IjoiMDQ1N2U4MzYxMDU1ZTc1ZjQ4ZDBkNmIxMjFmYjg3MDVkOWFhMDg4NmUxNzQyMzEyZTNlODZjOGQzZDk3NDhjYjU3MzA4ZDQ3NjZlMDhmMDA5OWY1OTkxYmIzYjFmNDk5OWE0YzhjNGI0NzYxYjI0MTBiM2MyYWYzYTMzNDllMzUxZSIsImNpcGhlcnRleHQiOiIxYmFiMDgzYmFjMDM5MzFhMzRiNmJiZjZiMjdlYzJlZjEwYTRhMjAwM2U2ZmJlZDI0NmEzZDk0ZTNjN2ZkNDFhY2Q5NzRlYzQ2NGViNjk1NDhlMWY1YTgwMzkyYWNiMDEwMjE5MjVkZGE0MDk2NTU1OTk4NDAwZDY0YzI5YTg4ODExMTAzMGY2ZDYxOTlmZWM3NmVlZTY3NjZhZmJmODJjZTIxZjQ3NmUwMGQ4MGU4MmM1MWQwMTZhNzQ1ZjkyMjVjM2I5YzE0ZThhZmQ2Yjc0NWRlMjJhMDI4MmRjY2VkZmMzNTg0MzgxMDFlZDM2YjFiYmIxOTAwMzE0ZDZhMzAzZDVlMWE0NjJjYmFmOWVhYTVjMTI4YzY4NjExNzM3MzlkNTZmODgxNTE2ZTg3ZjUxNzRjNDE5NjU2OTg5YWJhM2QyNmIwMjUyNGM5NDI1NzVkNjFlMjYzNDU2MzMxYzE3MjhhNGM1NGUzZjM2NmFiYWEzYWMzOTcwOTljNjQ5MDgzYTJmZWU3YjlkMGY4MDU0YzJiYmE5NTI5ZDQxYjI3MjBmMTFmYmRmMTYxY2IzYTdjY2VmMjUyMGM4ZDM1OTI3YjQ1YmQ2YjhjZjQ3MDVhYWZjNmVhOGUxYzI5ZWJjNTEiLCJtYWMiOiIwZjUyZGIyMzdjN2ZhNmQ4M2VmY2I0NDYwMzY3NDQ2MTJlY2JlY2I3ODA2YzE3YmU0NzdlZDUzOTUyZjcwODY1Iiwic2NoZW1lIjoiYXN5bS5jaGFpbmpzLnNlY3AyNTZrMSJ9'
export const encodedToken1wNullUrl =
  'eyJpdiI6bnVsbCwicHVibGljS2V5IjoiMDRjZWEyYzk1MTUwNGI1YmZlZmE3ODQ4MGFlNjMyZGEyYzc4ODk1NjEzMjVmOWQ3NmNhN2IwYTFlNjJmN2E4Y2Q1MmNlMzEzYzhiM2ZkM2M3ZmZlMmY1ODgzMjJlNWJlMzMxYzY0YjMxYjI1NmE4NzY5ZTkyZjk0N2FlNzEyYjc2MSIsImVwaGVtUHVibGljS2V5IjoiMDQwYjE1NWU1ZTNkYWEzYWJmMmJlMmM0YjM3NTlmN2M2ZmQyYTZkZTA0YThjNzk1OWQyYmIyYjUyYThhYTFmODIyZDE4MjUyOWMzNzI0YjVmYTJmYTNkN2E4YWZkMTFkNjBiYTVhN2FiMjJiMWY4NzFlOTlmODIwZmM1NzI1MmM0MCIsImNpcGhlcnRleHQiOiJiNmVkNjM2MDg1ZjQ3MGQ3ZjhhZDQ4ZmU0ZGU3M2YyODUwZjFhZDIzZjBhMGM4NTJlMzk1YWExZGE5MzUxZjY5ZDk5ZWVkMTZkYWRlZWZkYjJlYTRmY2I1NWZjMTljZjRkMTRjNGQ4ZTViMWFkNzczNTM4Y2ZlMjg0MTNiMGExMDRiNjA2ZmIyMWEzOGIyMDkzNzdjYWQzNDdjYTUxYzY5MDRkYWJhYWE4ZDU0MTc4MzUxNzUxNjdiZTIwNDJkNGFjMjNjM2IzOThiMzcxZTMyYzlkM2Q3ZTE5ZWU2YmVhZTA4ZmU0YThmNzIzMWZlOWQ5YTgxNWU0MDkxNjRiMjlhZDcxMjAxNGFiYWYwMTgzNmRhMzM3MzRhZGEzY2MyZWY0YmMxN2Q0NGU2OTg1N2U4Mjc0ZTFiNzk2NmMzMWI1MTIyNmM0MWI4MDAxNTlkYWE1YzA4ZGE5NTFjZTMyYzBjNjRiNjk5NmQ3Njg3NzMwNWYwNTYxZDg0ZWEzMjUyOWNkNGE0Y2IxOTc2NGU2ZTQ2YjAwOTM1NDA4ODQ4MGZmZjU4NzMwMGYxZDZlZGQ2YmI1YThmNjYwMTJiN2Y4ODQ1IiwibWFjIjoiNzkyZjY2MDc1ODBmZDQzMmIyODljODUyMjcxMmYxYTRiNjE1Nzg5NmE3YmVjNjcyYjRhZTcxYzljZGJmMDZhMCIsInNjaGVtZSI6ImFzeW0uY2hhaW5qcy5zZWNwMjU2azEifQ=='
export const requestBody1 = {}
export const requestBodyEmpty = {}
export const requestUrl = 'http://localhost:8080/sign'

const symmetricAesOptions1 = {
  salt: 'my-salt',
  iter: 50000,
}

export const encodedBody1: any = {
  chainType: 'ethereum',
  symmetricOptions: symmetricAesOptions1,
}

export const decodedAuthToken1: AuthToken = {
  url: requestUrl,
  payloadHash: 'c4b5063de69c0b3cbe469dd9aa932be3f86105ea99401be5d74388fbb7dcdcac',
  validFrom: new Date('2021-01-04T05:31:39.208Z'),
  validTo: new Date('2021-01-04T05:33:39.208Z'),
  secrets: { password: 'my-secure-password' },
}

export const decodedAuthToken1wNullUrl: AuthToken = {
  url: null,
  payloadHash: 'c4b5063de69c0b3cbe469dd9aa932be3f86105ea99401be5d74388fbb7dcdcac',
  validFrom: new Date('2021-01-04T05:31:39.208Z'),
  validTo: new Date('2021-01-04T05:33:39.208Z'),
  secrets: { password: 'my-secure-password' },
}
