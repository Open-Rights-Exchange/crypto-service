// import { AuthToken } from '../../../models'

// // to create encodedToken1...
// // const body: any = { chainType: 'ethereum', symmetricOptions: { salt: 'my-salt', iter: 50000 } }
// // const testAutToken = await createAuthToken( 'http://localhost:8080/sign', body, servicePublicKey, { password: 'my-secure-password' }, false, new Date('2021-01-04T05:31:39.208Z'), new Date('2021-01-04T05:33:39.208Z') )

// export const encodedToken1 =
//   'eyJpdiI6bnVsbCwicHVibGljS2V5IjoiMDRjZWEyYzk1MTUwNGI1YmZlZmE3ODQ4MGFlNjMyZGEyYzc4ODk1NjEzMjVmOWQ3NmNhN2IwYTFlNjJmN2E4Y2Q1MmNlMzEzYzhiM2ZkM2M3ZmZlMmY1ODgzMjJlNWJlMzMxYzY0YjMxYjI1NmE4NzY5ZTkyZjk0N2FlNzEyYjc2MSIsImVwaGVtUHVibGljS2V5IjoiMDQ1N2U4MzYxMDU1ZTc1ZjQ4ZDBkNmIxMjFmYjg3MDVkOWFhMDg4NmUxNzQyMzEyZTNlODZjOGQzZDk3NDhjYjU3MzA4ZDQ3NjZlMDhmMDA5OWY1OTkxYmIzYjFmNDk5OWE0YzhjNGI0NzYxYjI0MTBiM2MyYWYzYTMzNDllMzUxZSIsImNpcGhlcnRleHQiOiIxYmFiMDgzYmFjMDM5MzFhMzRiNmJiZjZiMjdlYzJlZjEwYTRhMjAwM2U2ZmJlZDI0NmEzZDk0ZTNjN2ZkNDFhY2Q5NzRlYzQ2NGViNjk1NDhlMWY1YTgwMzkyYWNiMDEwMjE5MjVkZGE0MDk2NTU1OTk4NDAwZDY0YzI5YTg4ODExMTAzMGY2ZDYxOTlmZWM3NmVlZTY3NjZhZmJmODJjZTIxZjQ3NmUwMGQ4MGU4MmM1MWQwMTZhNzQ1ZjkyMjVjM2I5YzE0ZThhZmQ2Yjc0NWRlMjJhMDI4MmRjY2VkZmMzNTg0MzgxMDFlZDM2YjFiYmIxOTAwMzE0ZDZhMzAzZDVlMWE0NjJjYmFmOWVhYTVjMTI4YzY4NjExNzM3MzlkNTZmODgxNTE2ZTg3ZjUxNzRjNDE5NjU2OTg5YWJhM2QyNmIwMjUyNGM5NDI1NzVkNjFlMjYzNDU2MzMxYzE3MjhhNGM1NGUzZjM2NmFiYWEzYWMzOTcwOTljNjQ5MDgzYTJmZWU3YjlkMGY4MDU0YzJiYmE5NTI5ZDQxYjI3MjBmMTFmYmRmMTYxY2IzYTdjY2VmMjUyMGM4ZDM1OTI3YjQ1YmQ2YjhjZjQ3MDVhYWZjNmVhOGUxYzI5ZWJjNTEiLCJtYWMiOiIwZjUyZGIyMzdjN2ZhNmQ4M2VmY2I0NDYwMzY3NDQ2MTJlY2JlY2I3ODA2YzE3YmU0NzdlZDUzOTUyZjcwODY1Iiwic2NoZW1lIjoiYXN5bS5jaGFpbmpzLnNlY3AyNTZrMSJ9'
// export const encodedToken1wNullUrl =
//   'eyJpdiI6bnVsbCwicHVibGljS2V5IjoiMDRjZWEyYzk1MTUwNGI1YmZlZmE3ODQ4MGFlNjMyZGEyYzc4ODk1NjEzMjVmOWQ3NmNhN2IwYTFlNjJmN2E4Y2Q1MmNlMzEzYzhiM2ZkM2M3ZmZlMmY1ODgzMjJlNWJlMzMxYzY0YjMxYjI1NmE4NzY5ZTkyZjk0N2FlNzEyYjc2MSIsImVwaGVtUHVibGljS2V5IjoiMDQwYjE1NWU1ZTNkYWEzYWJmMmJlMmM0YjM3NTlmN2M2ZmQyYTZkZTA0YThjNzk1OWQyYmIyYjUyYThhYTFmODIyZDE4MjUyOWMzNzI0YjVmYTJmYTNkN2E4YWZkMTFkNjBiYTVhN2FiMjJiMWY4NzFlOTlmODIwZmM1NzI1MmM0MCIsImNpcGhlcnRleHQiOiJiNmVkNjM2MDg1ZjQ3MGQ3ZjhhZDQ4ZmU0ZGU3M2YyODUwZjFhZDIzZjBhMGM4NTJlMzk1YWExZGE5MzUxZjY5ZDk5ZWVkMTZkYWRlZWZkYjJlYTRmY2I1NWZjMTljZjRkMTRjNGQ4ZTViMWFkNzczNTM4Y2ZlMjg0MTNiMGExMDRiNjA2ZmIyMWEzOGIyMDkzNzdjYWQzNDdjYTUxYzY5MDRkYWJhYWE4ZDU0MTc4MzUxNzUxNjdiZTIwNDJkNGFjMjNjM2IzOThiMzcxZTMyYzlkM2Q3ZTE5ZWU2YmVhZTA4ZmU0YThmNzIzMWZlOWQ5YTgxNWU0MDkxNjRiMjlhZDcxMjAxNGFiYWYwMTgzNmRhMzM3MzRhZGEzY2MyZWY0YmMxN2Q0NGU2OTg1N2U4Mjc0ZTFiNzk2NmMzMWI1MTIyNmM0MWI4MDAxNTlkYWE1YzA4ZGE5NTFjZTMyYzBjNjRiNjk5NmQ3Njg3NzMwNWYwNTYxZDg0ZWEzMjUyOWNkNGE0Y2IxOTc2NGU2ZTQ2YjAwOTM1NDA4ODQ4MGZmZjU4NzMwMGYxZDZlZGQ2YmI1YThmNjYwMTJiN2Y4ODQ1IiwibWFjIjoiNzkyZjY2MDc1ODBmZDQzMmIyODljODUyMjcxMmYxYTRiNjE1Nzg5NmE3YmVjNjcyYjRhZTcxYzljZGJmMDZhMCIsInNjaGVtZSI6ImFzeW0uY2hhaW5qcy5zZWNwMjU2azEifQ=='
// export const VALID_AUTH_TOKEN =
//   'eyJpdiI6bnVsbCwicHVibGljS2V5IjoiMDRjZWEyYzk1MTUwNGI1YmZlZmE3ODQ4MGFlNjMyZGEyYzc4ODk1NjEzMjVmOWQ3NmNhN2IwYTFlNjJmN2E4Y2Q1MmNlMzEzYzhiM2ZkM2M3ZmZlMmY1ODgzMjJlNWJlMzMxYzY0YjMxYjI1NmE4NzY5ZTkyZjk0N2FlNzEyYjc2MSIsImVwaGVtUHVibGljS2V5IjoiMDQxNjFlNWJhNmRjMDQ4YTMzOGJkZjdlOTIzNzgxMzE2MzAwZjU3M2FlZTIyMjFhNWE3NzVkMjJkMTkyMjYwMDhkOWQxZmQwYWEyNjFkOTY5MjMwZTQ0ZGQzOGNiN2Y3NGRmN2M4YTUxNTA5NTY5NjA0MmZjMzNhYzI4YzQwZDBlNCIsImNpcGhlcnRleHQiOiJmMzU4ZDRmYWRiYWY0OGMwOTkzMTBiMzAxNzY0Yzc5ZDc4YWU3ZGVhZWQ1ZWJmMzc4YTNkNTRhOTUyMmUxY2EzMTI0YWY0MmYyMzA3NDhkZTQ5YWY0NGQ4OGViOTRhYmU2NzAwYjRhMWFjNmRjZDFjYTg1YmQ2YTdmNjUxYmU3ODNmZGNjYjBkYjI3ZjkzMzUzOWI4OWFmOTE4ZGZjOGIzNTNhMDNmNDgxMTcxOWQ2MTM1YjgxNDk1NWJhN2MxNmMzNjYwNjhiODYxNjBiMDQ0MDAyYzNiZjA4YzBlMjgzNGI4NTM2MWFiYTg0MWU0MmRkNTM1MzIxMzJiOTU3OGMzNWI0NDNmOTVmNGY2MDM3OWNmNTA2MzlmYTY2MTc1NjRhY2IyMDMyMzYwOWU4NGZmMDEyYzQ5YmRjMmY4ZmZkZTRiMTJkMDg5NjliM2M2Y2UyNDE1NDZjZGRlNjhhZmY5YTlkNTQ1ZjQ4ZGQ1YzJlMTljY2Y5OTBhMDI1YTkwODc5OWNkYzQ4NGM0YWNkY2RiMzMxYmRlMmNiNWRlYjIyYWQzZDEyNzlmNjRlNzNiNmUzNzE0ZDU2OTA5YmVkYzE5MzNiMmIwOTVlMjBjYzY0YzUyODA1MWQzMTJmNDA2YzUiLCJtYWMiOiIyMDNlYjcyMGI2MTQwMzk0MWRkMmQ2MzM2MjIxMDU2YTk5ZWFjYzEyODFlNzU3OTczMTI0MmRmYWVlZDFjZDM1Iiwic2NoZW1lIjoiYXN5bS5jaGFpbmpzLnNlY3AyNTZrMSJ9'
// export const INVALID_ENCRYPTED_AUTH_TOKEN =
//   'eyJpdiI6bnVsbCwicHVibGljS2V5IjoiMDQyZTQzOGM5OWJkN2RlZDI3ZWQ5MjE5MTllMWQ1ZWUxZDliMTUyOGJiOGEyZjZjOTc0MzYyYWQxYTliYTdhNmY1OWE0NTJhMGU0ZGZiYzE3OGFiNWM1YzA5MDUwNmJkN2YwYTY2NTlmZDNjZjBjYzc2OWQ2YzE3MjE2ZDQxNDE2MyIsImVwaGVtUHVibGljS2V5IjoiMDQ5YzgyYWQ5OTY5ZDEyMjMyOTBkMTFjNjc0ZDM5NDM4ODIwYzY5NTg4NWVjMWRkNzg1NWFlMGFjY2RkMGUzMGMyMjlhZmU0Y2NhZDU5NjE5YzkxNDYxZjFiZGNjODMxZDIzNGVhODRkODAzYjNkOTlhMmM0ZjgzZWI0MGFlNTM3NyIsImNpcGhlcnRleHQiOiJiZWY2N2ZmNTk0ODcxMTM2MzYxMjM3NDZlZDkwODMxMmMzZjg5NWU5Zjg0MGI4YzM3M2Y2Y2FkNzk4NTljMjBiN2EzMTJmY2VkM2E3YzhjZGNlMWEzZGQ0MDY0ZmQ3Mzg2OWNkOTk0NWZmZTkxYzdjODVmOWMzYTM3MDdhMzM4ZTE0YjYxMjY2NTM1NDdlMGJlNjYyN2Q1OWI4MmQxMTYxZmE5YTdlMjE3MjZiZTcwOTE4ZDcyODQ1Njk5ZTFlNTU0MjQwNGU4Mzg3Y2NhNWMxOTg2ZjM3MTYwZTIyNmJlODc2NzhmODFhZWFiNjEzOTQ3YTVkZDc5N2JkN2JiZmJlNDZhYjI2ODUxZThmM2M5MWM0OWYxZDNlN2FlZTkzNjgxZjk5Nzg3M2I0NzNlMWY3ZDJmNzY3NGY0MjEzNTY0NWRmMmYzMzZkOWJjNmNkY2ZjODVhMWNhYWUwOTg4ZDJhZGExMDgwMjM1Mzc2YjM5MzI5OGIzMmRlMzhmYjgyNGQ0NDFkMzY1MTEwYjZmNGU2ZmIwZGU5ZGFhYzhmZDg2OCIsIm1hYyI6ImVkODRhMTc2NDA1NmJhNmU1ZTE3MjJkMjNhMjU4YmZkMjA2ZTg4NzhhYzVjZmJmNjU4MzYzOGNiYWM1ZDZiOGEiLCJzY2hlbWUiOiJhc3ltLmNoYWluanMuc2VjcDI1NmsxIn0='
// export const EXPIRED_AUTH_TOKEN =
//   'eyJpdiI6bnVsbCwicHVibGljS2V5IjoiMDRjZWEyYzk1MTUwNGI1YmZlZmE3ODQ4MGFlNjMyZGEyYzc4ODk1NjEzMjVmOWQ3NmNhN2IwYTFlNjJmN2E4Y2Q1MmNlMzEzYzhiM2ZkM2M3ZmZlMmY1ODgzMjJlNWJlMzMxYzY0YjMxYjI1NmE4NzY5ZTkyZjk0N2FlNzEyYjc2MSIsImVwaGVtUHVibGljS2V5IjoiMDQxZDBhZjg4YWIyY2ZjNDIyMTZhMDdkZTQ3NTZkYjk1ZWY0YzNhYmRiOTMzMjliNzFkNDgzMzdjNDk2NmMxZGRiZWUyOWE0MTMwZjlhNDkwYjExZmQ5NmMwM2MxYjQ0YmUyYWFjZmZmZWUyMGUwODVmZDQzZjVjMDdkZWMxNDY0MyIsImNpcGhlcnRleHQiOiIxNjAxZDRmYWQ4NDJjNjVjM2E4YTEyNjZiMzg4NWEyMThjMzkyOGVhMTBkMTIwMGYyMmFlY2Y4MzU5YWU5YjA5YjVkMDNjYjY2Y2Y3NzNhODBiZTE2Y2I5ZGJjMzJlY2QxYWJmOTM2Y2QwOWVmNmY5MTIwM2I2MGYwOTY1OWMzNmY2NmM5YzFlZmIzOWI3MmFkZGU0MmM5ZmYzMmQxZTdlM2U1NjQ4MzY0NjNhMjIzMmIyYTRjODY0NTBmMjAzNjk2YWE0ODdlOWJjZWMyMDIwZGM5OTVlOWZhMjU2MGQ0NDQxMzg2ZmE3MzZlYTk4NjA4M2FmNDUzYmIwZmQwMzMwMjYzMzI3MzY5ZWUzMjcwZTc0YWZjYzhmMGIxNzJkZjEyY2Y1ZWQwOTg1MGExZTYwNjQ5YjQ5NDU1OTUwYmVjNWJmODI0M2Q2MTgzYzcwNmIzN2I1ZmY5ZDFmNGUyMjBhM2JlZDg1NDI3YmVjYmJkZDcxZDViMmQ1YjM3NTI0ZDJjNjE5YjM3ZmI1ZGQxYTVmNDc2ODVkOTFjNGMwNzVmYyIsIm1hYyI6IjUyNTRiN2FhZmI4ZjBkMTMxYzgyZDBkYTViOWMxYjcyMzcyYmQ1MGU5YTM0NGFmZDU2MWVmMjQ0ZDA4ODk3ZTQiLCJzY2hlbWUiOiJhc3ltLmNoYWluanMuc2VjcDI1NmsxIn0='
// export const requestBody1 = {}
// export const requestBodyEmpty = {}
// export const requestUrl = 'http://localhost:8080/sign'

// const symmetricAesOptions1 = {
//   salt: 'my-salt',
//   iter: 50000,
// }

// export const encodedBody1: any = {
//   chainType: 'ethereum',
//   symmetricOptions: symmetricAesOptions1,
// }

// export const decodedAuthToken1: AuthToken = {
//   url: 'http://localhost:8080/sign',
//   payloadHash: '44136fa355b3678a1146ad16f7e8649e94fb4fc21fe77e8310c060f61caaff8a',
//   validFrom: new Date('2021-01-04T05:31:39.208Z'),
//   validTo: new Date('2021-01-04T05:33:39.208Z'),
//   secrets: { password: 'my-secure-password' },
// }

// export const decodedAuthToken1wNullUrl: AuthToken = {
//   url: null,
//   payloadHash: 'c4b5063de69c0b3cbe469dd9aa932be3f86105ea99401be5d74388fbb7dcdcac',
//   validFrom: new Date('2021-01-04T05:31:39.208Z'),
//   validTo: new Date('2021-01-04T05:33:39.208Z'),
//   secrets: { password: 'my-secure-password' },
// }
