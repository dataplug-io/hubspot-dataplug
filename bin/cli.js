#!/usr/bin/env node

const path = require('path')

require('@dataplug/dataplug-cli').build()
  .usingCollectionsFromDir(path.join(__dirname, '../lib/collections'))
  .process()
