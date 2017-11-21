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
    associations: {
      type: ['object', 'null'],
      properties: {
        associatedVids: {
          type: 'array',
          items: {
            type: 'integer'
          }
        },
        associatedCompanyIds: {
          type: 'array',
          items: {
            type: 'integer'
          }
        },
        associatedDealIds: {
          type: 'array',
          items: {
            type: 'integer'
          }
        }
      },
      additionalProperties: false
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
          type: 'integer',
          default: 0
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
    import: {
      type: 'object',
      properties: {
        importKey: {
          type: 'string'
        },
        importDate: {
          type: 'integer'
        }
      },
      additionalProperties: false
    },
    stateChanges: {
      type: 'object',
      additionalProperties: false
    }
  },
  properties: {
    portalId: {
      type: 'integer'
    },
    dealId: {
      type: 'integer'
    },
    isDeleted: {
      type: 'boolean'
    },
    associations: {
      $ref: '#/definitions/associations'
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
    imports: {
      type: 'array',
      items: {
        $ref: '#/definitions/import'
      }
    },
    stateChanges: {
      type: 'array',
      items: {
        $ref: '#/definitions/stateChanges'
      }
    }
  },
  additionalProperties: false,
  required: ['portalId', 'dealId']
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
    },
    includePropertyVersions: {
      description: 'Include previous versions of property values',
      type: 'boolean',
      default: true
    }
  })
  // TODO: implies('since', 'recently')
)

const dealsQueryMapping = config.mapping.query.extended((mapping) => mapping
  .remap('since', (value) => ({ since: moment(value).valueOf() }))
)
const dealDetailsQueryMapping = config.mapping.query.extended((mapping) => mapping
  .asIs('includePropertyVersions')
)

const factory = (params) => {
  params = _.clone(params)

  let uri = '/deals/v1/deal/paged'
  let selector = '!.deals.*'
  if (params.recently === 'created') {
    uri = '/deals/v1/deal/recent/created'
    selector = '!.results.*'
  } else if (params.recently === 'updated') {
    uri = '/deals/v1/deal/recent/modified'
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
  const query = dealsQueryMapping.apply(params)
  const headers = config.mapping.headers.apply(params)
  const responseHandler = responseHandlerFactory(params)

  const detailsMapper = (deal) => {
    if (!deal) {
      return
    }
    const url = new URL(`/deals/v1/deal/${deal.dealId}`, params.endpoint)
    const query = dealDetailsQueryMapping.apply(params)
    const headers = config.mapping.headers.apply(params)

    const transform = new JsonStreamReader('!')
    return new HttpGetReader(url, {
      transform,
      query,
      headers,
      responseHandler
    })
  }

  const dealsStream = new PagedHttpGetReader(url, nextPage, {
    transformFactory,
    query,
    headers,
    responseHandler
  })
  const mapperStream = new Mapper(detailsMapper)
  return [dealsStream, mapperStream]
}

const source = new Source(configDeclaration, factory)

module.exports = {
  origin: 'hubspot',
  name: 'deals',
  schema,
  source
}
