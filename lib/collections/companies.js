const { URL } = require('url')
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

const configDeclaration = config.declaration.extended((declaration) => declaration
  .parameters({
    recently: {
      description: 'Fetch only recent comapneis in descending order by date',
      enum: ['created', 'updated']
    }
  })
)

const factory = (params) => {
  let uri = '/companies/v2/companies/paged'
  let selector = '!.companies.*'
  if (params.recently === 'created') {
    uri = '/companies/v2/companies/recent/created'
    selector = '!.results.*'
  } else if (params.recently === 'updated') {
    uri = '/companies/v2/companies/recent/modified'
    selector = '!.results.*'
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
  const query = config.mapping.query.apply(params)
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
  companiesStream
    .pipe(mapperStream)
  return [companiesStream, mapperStream]
}

const source = new Source(configDeclaration, factory)

module.exports = {
  origin: 'hubspot',
  name: 'companies',
  schema,
  source
}
