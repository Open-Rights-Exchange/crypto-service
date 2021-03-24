export class StateStore {
  public transportKeyStore: { publicKey: string; privateKey: string; expiresOn: Date }[] = []

  cleanupTimer: NodeJS.Timeout

  constructor() {
    this.doCleanup()
  }

  // every 1 second, clear expired keys, etc.
  doCleanup() {
    this.removeExpiredKeys()
    // schedule next cleanup
    this.cleanupTimer = setTimeout(() => {
      this.doCleanup()
    }, 1000)
  }

  clearState() {
    this.transportKeyStore = []
  }

  removeExpiredKeys() {
    // only keep keys that expired in the future
    this.transportKeyStore = this.transportKeyStore.filter(k => k.expiresOn.getTime() >= new Date().getTime())
  }
}
