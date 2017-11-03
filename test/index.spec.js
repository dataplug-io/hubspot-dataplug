/* eslint-env node, mocha */
require('chai')
  .should()
const dataplugTestsuite = require('@dataplug/dataplug-testsuite')
const hubspotDataplug = require('../lib')

describe('hubspot-dataplug', () => {
  dataplugTestsuite
    .forCollection('companies', hubspotDataplug.companies)
    .use()

  dataplugTestsuite
    .forCollection('contacts', hubspotDataplug.contacts)
    .use()

  dataplugTestsuite
    .forCollection('deals', hubspotDataplug.deals)
    .use()

  dataplugTestsuite
    .forCollection('owners', hubspotDataplug.owners)
    .use()
})
