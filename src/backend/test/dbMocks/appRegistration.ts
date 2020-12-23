declare let global: any

export const appRegistration = (data: any) => ({
  _id: global.TEST_APP_APPID,
  name: 'Test Demo App',
  apiKeys: [
    {
      isRevoked: false,
      apiKey: global.TEST_APP_API_KEY,
      createdOn: '2018-03-06T22:31:12.880+0000',
    },
  ],
  notificationEmails: ['notify@email.com'],
  ownerId: 'partner|000000',
  createdBy: 'partner|000000',
  updatedBy: 'partner|000000',
  createdOn: Date.now(),
  updatedOn: Date.now(),
  ...data,
})
