import { ship } from './snackship.js'
import path from 'path'
import commander from 'commander'

const version = require('../../package.json').version

console.log(`----> shipping with snackship v${version}`)

commander
  .version(version)
  .option('-c, --config-file [file]', 'config file [snackship.json]', 'snackshp.js')
  .parse(process.argv)

const config = ((commander, path) =>
  REQUIRE_CONFIG // eslint-disable-line
)(commander, path)

console.log('config', config)

ship(config)

