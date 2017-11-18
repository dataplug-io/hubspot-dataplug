/* eslint-env node, mocha */
require('chai')
  .should()
const dataplugTestsuite = require('@dataplug/dataplug-testsuite')
const hubspotDataplug = require('../lib')

describe('hubspot-dataplug', () => {
  dataplugTestsuite
    .forCollection('companies', hubspotDataplug.companies)
    .execute()

  dataplugTestsuite
    .forCollection('contacts', hubspotDataplug.contacts)
    .execute()

  dataplugTestsuite
    .forCollection('deals', hubspotDataplug.deals)
    .execute()

  dataplugTestsuite
    .forCollection('owners', hubspotDataplug.owners)
    .execute()
})
