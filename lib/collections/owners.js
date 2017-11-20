const { URL } = require('url')
const dataplug = require('@dataplug/dataplug')
const { HttpGetReader } = require('@dataplug/dataplug-http')
const { JsonStreamReader } = require('@dataplug/dataplug-json')
const responseHandlerFactory = require('../responseHandlerFactory')
const config = require('../config')

const schema = {
  type: 'object',
  definitions: {
    remoteListItem: {
      type: 'object',
      properties: {
        id: {
          type: 'integer'
        },
        portalId: {
          type: 'integer'
        },
        ownerId: {
          type: 'integer'
        },
        remoteId: {
          type: 'string'
        },
        remoteType: {
          type: 'string'
        },
        active: {
          type: 'boolean'
        }
      },
      additionalProperties: false
    }
  },
  properties: {
    portalId: {
      type: 'integer'
    },
    ownerId: {
      type: 'integer'
    },
    type: {
      type: 'string'
    },
    firstName: {
      type: 'string'
    },
    lastName: {
      type: 'string'
    },
    email: {
      type: 'string'
    },
    createdAt: {
      type: 'integer'
    },
    signature: {
      type: ['string', 'null']
    },
    updatedAt: {
      type: 'integer'
    },
    quota: {
      type: ['integer', 'null']
    },
    hasContactsAccess: {
      type: ['boolean', 'null']
    },
    remoteList: {
      type: ['array', 'null'],
      items: {
        $ref: '#/definitions/remoteListItem'
      }
    }
  },
  additionalProperties: false,
  required: ['portalId', 'ownerId']
}

const configDeclaration = config.declaration.extended((declaration) => declaration
  .parameters({
    includeInactive: {
      description: 'Include inactive owners (defined as owner without any active remotes)',
      type: 'boolean',
      default: true
    },
    email: {
      description: 'Search for owners matching the specified email address',
      type: 'string'
    }
  }))

const queryMapping = config.mapping.query.extended((mapping) => mapping
  .asIs('includeInactive')
  .asIs('email'))

const factory = (params) => {
  const url = new URL('/owners/v2/owners/', params.endpoint)
  const transform = new JsonStreamReader('!.*')
  const query = queryMapping.apply(params)
  const headers = config.mapping.headers.apply(params)
  const responseHandler = responseHandlerFactory(params)

  return new HttpGetReader(url, {
    transform,
    query,
    headers,
    responseHandler
  })
}

const source = dataplug.source(configDeclaration, factory)

module.exports = {
  origin: 'hubspot',
  name: 'owners',
  schema,
  source
}
