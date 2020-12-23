const path = require('path')
const fs = require('fs')
const mongoose = require('mongoose')
const globalConfigPath = path.join(__dirname, 'globalConfig.json')

module.exports = async function() {
  const mongoConfig = {
    mongoDBName: 'jest',
  }

  // Write global config to disk because all tests run in different contexts.
  fs.writeFileSync(globalConfigPath, JSON.stringify(mongoConfig))
  console.log('Config is written')
}
