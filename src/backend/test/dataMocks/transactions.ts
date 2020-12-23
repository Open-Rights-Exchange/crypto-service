export const createSampleTransaction = (actor: any, permission: string, data?: any) => {
  const transaction = {
    account: 'demoapphello',
    name: 'hi',
    authorization: [
      {
        actor,
        permission,
      },
    ],
    data: {
      user: actor,
    },
    ...data,
  }

  return transaction
}
