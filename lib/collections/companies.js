const { URL } = require('url')
const { Source, MappedStream } = require('@dataplug/dataplug')
const { HttpGetReader, PagedHttpGetReader } = require('@dataplug/dataplug-http')
const { JsonStreamReader } = require('@dataplug/dataplug-json')
const config = require('../config')

const schema = {
  type: 'object',
  definitions: {
    'source-type': require('../types/source-type'),
    'company-property': {
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
            $ref: '#/definitions/company-property-value-history'
          }
        }
      },
      additionalProperties: false
    },
    'company-property-value-history': {
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
      '^.*$': {
        $ref: '#/definitions/company-property'
      }
    }
  },
  additionalProperties: false,
  required: ['portalId', 'companyId']
}

const configDeclaration = config.declaration.extended((declaration) => declaration
  .parameters({
    recentlyCreated: {
      description: 'Fetch recently created companies in descending order by create date'
    },
    recentlyUpdated: {
      description: 'Fetch recently updated companies in descending order by update date'
    }
  })
  .conflicts('recentlyCreated', 'recentlyUpdated')
)

const factory = (params) => {
  let uri = '/companies/v2/companies/paged'
  let selector = '!.companies.*'
  if (params.recentlyCreated) {
    uri = '/companies/v2/companies/recent/created'
    selector = '!.results.*'
  } else if (params.recentlyUpdated) {
    uri = '/companies/v2/companies/recent/modified'
    selector = '!.results.*'
  }

  const url = new URL(uri, params.endpoint)
  const nextPage = (page, data) => {
    if (data) {
      if (data['hasMore']) {
        const offset = data['offset']
        page.query['offset'] = offset

        return true
      }
    }
    return false
  }
  const transformFactory = () => new JsonStreamReader(selector)
  const query = config.mapping.query.apply(params)
  const headers = config.mapping.headers.apply(params)

  const detailsMapper = async (stream, company) => new Promise((resolve, reject) => {
    if (!company) {
      resolve()
      return
    }
    const url = new URL(`/companies/v2/companies/${company.companyId}`, params.endpoint)
    const query = config.mapping.query.apply(params)
    const headers = config.mapping.headers.apply(params)

    const transform = new JsonStreamReader('!')
    const detailsStream = new HttpGetReader(url, transform, query, headers)
    detailsStream
      .on('end', resolve)
      .on('error', reject)
      .on('data', data => stream.push(data))
  })

  const companiesStream = new PagedHttpGetReader(url, nextPage, transformFactory, query, headers)
  return companiesStream.pipe(new MappedStream(detailsMapper))
}

const source = new Source(configDeclaration, factory)

module.exports = {
  origin: 'hubspot',
  name: 'companies',
  schema,
  source
}
