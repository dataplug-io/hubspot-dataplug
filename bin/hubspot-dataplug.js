#!/usr/bin/env node

require('@dataplug/dataplug-cli')
  .fromDir(__dirname + '/../lib/collections')
  .argv;
