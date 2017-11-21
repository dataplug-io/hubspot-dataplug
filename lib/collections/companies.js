const _ = require('lodash')
const { URL } = require('url')
const moment = require('moment')
const { Source, Mapper } = require('@dataplug/dataplug')
const { HttpGetReader, PagedHttpGetReader } = require('@dataplug/dataplug-http')
const { JsonStreamReader } = require('@dataplug/dataplug-json')
const responseHandlerFactory = require('../responseHandlerFactory')
const config = require('../config')

const schema = {
  type: 'object',
  definitions: {
    sourceType: {
      type: ['string', 'null']
    },
    property: {
      type: 'object',
      properties: {
        value: {
          type: 'string'
        },
        timestamp: {
          type: 'integer'
        },
        source: {
          $ref: '#/definitions/sourceType'
        },
        sourceId: {
          type: ['string', 'null']
        },
        versions: {
          type: 'array',
          items: {
            $ref: '#/definitions/valueHistory'
          }
        }
      },
      additionalProperties: false
    },
    valueHistory: {
      type: 'object',
      properties: {
        name: {
          type: 'string'
        },
        value: {
          type: 'string'
        },
        timestamp: {
          type: 'integer'
        },
        source: {
          $ref: '#/definitions/sourceType'
        },
        sourceId: {
          type: ['string', 'null']
        },
        sourceVid: {
          type: 'array',
          items: {
            type: 'integer'
          }
        }
      },
      additionalProperties: false,
      required: ['timestamp']
    },
    stateChanges: {
      type: 'object',
      additionalProperties: false
    },
    mergeAudit: {
      type: 'object',
      additionalProperties: false
    }
  },
  properties: {
    portalId: {
      type: 'integer'
    },
    companyId: {
      type: 'integer'
    },
    isDeleted: {
      type: 'boolean'
    },
    properties: {
      type: 'object',
      patternProperties: {
        '^.*$': {
          $ref: '#/definitions/property'
        }
      },
      additionalProperties: false
    },
    additionalDomains: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: true
      }
    },
    stateChanges: {
      type: 'array',
      items: {
        $ref: '#/definitions/stateChanges'
      }
    },
    mergeAudits: {
      type: 'array',
      items: {
        $ref: '#/definitions/mergeAudit'
      }
    }
  },
  additionalProperties: false,
  required: ['portalId', 'companyId']
}

const earliestSince = moment()
  .subtract(30, 'days')
  .add(1, 'seconds')
  .milliseconds(0)
const configDeclaration = config.declaration.extended((declaration) => declaration
  .parameters({
    recently: {
      description: 'Fetch only recent comapneis in descending order by date',
      enum: ['created', 'updated']
    },
    since: {
      description: 'Date and time to query data since',
      type: 'string',
      format: 'date-time',
      default: earliestSince.format()
    }
  })
  // TODO: implies('since', 'recently')
)

const companiesQueryMapping = config.mapping.query.extended((mapping) => mapping
  .remap('since', (value) => ({ since: moment(value).valueOf() }))
)

const factory = (params) => {
  params = _.clone(params)

  let uri = '/companies/v2/companies/paged'
  let selector = '!.companies.*'
  if (params.recently === 'created') {
    uri = '/companies/v2/companies/recent/created'
    selector = '!.results.*'
  } else if (params.recently === 'updated') {
    uri = '/companies/v2/companies/recent/modified'
    selector = '!.results.*'
  }

  if (params.recently) {
    const since = moment(params.since)
    if (since.diff(earliestSince) < 0) {
      throw new Error(`Invalid range: since ${since} can not be before ${earliestSince}`)
    }
  } else {
    delete params.since
  }

  const url = new URL(uri, params.endpoint)
  const nextPage = (page, data) => {
    if (data && data['hasMore']) {
      const offset = data['offset']
      page.query['offset'] = offset

      return true
    }
    return false
  }
  const transformFactory = () => new JsonStreamReader(selector)
  const query = companiesQueryMapping.apply(params)
  const headers = config.mapping.headers.apply(params)
  const responseHandler = responseHandlerFactory(params)

  const detailsMapper = (company) => {
    if (!company) {
      return
    }
    const url = new URL(`/companies/v2/companies/${company.companyId}`, params.endpoint)
    const query = config.mapping.query.apply(params)
    const headers = config.mapping.headers.apply(params)

    const transform = new JsonStreamReader('!')
    return new HttpGetReader(url, {
      transform,
      query,
      headers,
      responseHandler
    })
  }

  const companiesStream = new PagedHttpGetReader(url, nextPage, {
    transformFactory,
    query,
    headers,
    responseHandler
  })
  const mapperStream = new Mapper(detailsMapper)
  return [companiesStream, mapperStream]
}

const source = new Source(configDeclaration, factory)

module.exports = {
  origin: 'hubspot',
  name: 'companies',
  schema,
  source
}
