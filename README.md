# snackship

abstractions around production deployment

## install

```bash
npm install --save-dev snackship
```

## set up

```js
// snackship.js

import { archiveS3, deployS3 } from 'snackship'

export default {
  src: 'src',
  targetBucket: 'production',
  archiveBucket: 'production',
  strategy: async config => {
    try {
      await archiveS3({
        dir: config.src,
        bucket: config.archiveBucket,
        key: `build-${(new Date()).toString().replace(/ /, '_')}.tgz`
      })
      
      await deployS3({
        dir: config.src,
        bucket: config.targetBucket
      })
    } catch (e) {
      console.log(`error: ${e}`)
      throw e
    }
  }
}
```

## run

```bash
snackship -c snackship.js
```

