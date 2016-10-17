import { ship } from './snackship.js'
import { readFileSync } from 'fs'
import commander from 'commander'

const version = require('../../package.json').version

console.log(`----> shipping with snackship v${version}`)

commander
  .version(version)
  .option('-c, --config-file [file]', 'config file [snackship.json]', 'snackshp.json')
  .parse(process.argv)

const config = JSON.parse(readFileSync(commander.configFile, 'utf8'))

ship(config)

