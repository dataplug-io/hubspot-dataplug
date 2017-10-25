#!/usr/bin/env node

const cli = require('@dataplug/dataplug-cli')

let builder = cli.build()
builder = builder.usingCollectionsFromDir(__dirname + '/../lib/collections')

builder.process()
