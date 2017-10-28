const { URL } = require('url')
const { Source, MappedStream } = require('@dataplug/dataplug')
const { HttpGetReader, PagedHttpGetReader } = require('@dataplug/dataplug-http')
const { JsonStreamReader } = require('@dataplug/dataplug-json')
const config = require('../config')

const schema = {
  type: 'object',
  definitions: {
    'source-type': require('../types/source-type'),
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
    'deal-property': {
      type: 'object',
      properties: {
        value: {
          type: 'string'
        },
        timestamp: {
          type: 'integer'
        },
        source: {
          $ref: '#/definitions/source-type'
        },
        sourceId: {
          type: ['string', 'null']
        },
        versions: {
          type: 'array',
          items: {
            $ref: '#/definitions/deal-property-value-history'
          }
        }
      },
      additionalProperties: false
    },
    'deal-property-value-history': {
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
          $ref: '#/definitions/source-type'
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
    'state-changes': {
      type: 'object',
      properties: {
      },
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
          $ref: '#/definitions/deal-property'
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
        $ref: '#/definitions/state-changes'
      }
    }
  },
  additionalProperties: false,
  required: ['portalId', 'dealId']
}

const configDeclaration = config.declaration.extended((declaration) => declaration
  .parameters({
    recentlyCreated: {
      description: 'Fetch recently created deals in descending order by create date'
    },
    recentlyUpdated: {
      description: 'Fetch recently updated deals in descending order by update date'
    }
  })
  .conflicts('recentlyCreated', 'recentlyUpdated')
  .parameters({
    includePropertyVersions: {
      description: 'Include previous versions of property values',
      type: 'boolean',
      default: true
    }
  }))

const dealDetailsQueryMapping = config.mapping.query.extended((mapping) => mapping
  .asIs('includePropertyVersions'))

const factory = (params) => {
  let uri = '/deals/v1/deal/paged'
  let selector = '!.deals.*'
  if (params.recentlyCreated) {
    uri = '/deals/v1/deal/recent/created'
    selector = '!.results.*'
  } else if (params.recentlyUpdated) {
    uri = '/deals/v1/deal/recent/modified'
    selector = '!.results.*'
  }

  const url = new URL(uri, params.endpoint)
  const nextPage = (page, data) => {
    if (data) {
      if (data['hasMore']) {
        const offset = data['offset']
        page.query['offset'] = offset

        // Used in recentlyCreated & recentlyUpdated modes
        const since = data['since']
        if (since) {
          page.query['since'] = since
        }

        return true
      }
    }
    return false
  }
  const transformFactory = () => new JsonStreamReader(selector)
  const query = config.mapping.query.apply(params)
  const headers = config.mapping.headers.apply(params)

  const detailsMapper = async (stream, deal) => new Promise((resolve, reject) => {
    if (!deal) {
      resolve()
      return
    }
    const url = new URL(`/deals/v1/deal/${deal.dealId}`, params.endpoint)
    const query = dealDetailsQueryMapping.apply(params)
    const headers = config.mapping.headers.apply(params)

    const transform = new JsonStreamReader('!')
    const detailsStream = new HttpGetReader(url, transform, query, headers)
    detailsStream
      .on('end', resolve)
      .on('error', reject)
      .on('data', data => stream.push(data))
  })

  const dealsStream = new PagedHttpGetReader(url, nextPage, transformFactory, query, headers)
  return dealsStream.pipe(new MappedStream(detailsMapper))
}

const source = new Source(configDeclaration, factory)

module.exports = {
  origin: 'hubspot',
  name: 'deals',
  schema,
  source
}
