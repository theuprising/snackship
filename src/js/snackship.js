import { spawn } from 'child_process'

const s3Cli = 'node_modules/.bin/s3-cli'

import 'babel-polyfill'
import babel from 'babel-register'
babel({
  presets: ['stage-0', 'es2015'],
  plugins: ['transform-object-rest-spread']
})

const version = require('../../package.json').version

export const exec = cmd =>
  new Promise((resolve, reject) => {
    const parse = cmd => {
      const [first, ...rest] = cmd.split(' ')
      return [first, rest]
    }

    const p = spawn(...parse(cmd))

    let output = {
      stdout: '',
      stderr: '',
      code: ''
    }

    p.stdout.on('data', data => { output.stdout += data })
    p.stderr.on('data', data => { output.stderr += data })
    p.on('close', code => {
      output.code = code
      if (code === '0') {
        resolve(output)
      } else {
        reject(output)
      }
    })
  })

const uuidV4 = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })

export const archiveS3 = async ({dir, bucket, key}) => {
  const f = uuidV4()
  console.log('----> ⛵️ archiving to s3')
  await exec('mkdir -p tmp')
  await exec(`tar czf tmp/tar-${f} ${dir}`)
  await exec(`${s3Cli} put tmp/tar-${f} s3://${bucket}/${key}`)
  console.log('----> ⛵️ done archiving to s3')
  return
}

export const deployS3 = async ({dir, bucket}) => {
  console.log('----> ⛵️ deploying to s3')
  await exec(`${s3Cli} sync -P ${dir} s3://${bucket}/`)
  console.log('----> ⛵️ done deploying to s3')
  return
}

export const ship = config => {
  console.log(`----> ⛵️ shipping with snackship ${version}`)
  config.strategy(config)
  console.log('----> ⛵️ shipped!')
}

export default ship

