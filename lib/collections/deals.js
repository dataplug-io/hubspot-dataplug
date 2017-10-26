const dataplug = require('@dataplug/dataplug')
const config = require('../config')
const factory = require('../factory')

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

const uri = (params) => {
  if (params.recentlyCreated) {
    return '/deals/v1/deal/recent/created'
  } else if (params.recentlyUpdated) {
    return '/deals/v1/deal/recent/modified'
  }

  return '/deals/v1/deal/paged'
}

const selector = (params) => {
  if (params.recentlyCreated || params.recentlyUpdated) {
    return '!.results.*'
  }

  return '!.deals.*'
}

const source = dataplug.source(
  config.declaration.extended((declaration) => declaration
    .parameters({
      recentlyCreated: {
        description: 'Fetch recently created contacts in descending order by create date'
      },
      recentlyUpdated: {
        description: 'Fetch recently updated contacts in descending order by update date'
      }
    })
    .conflicts('recentlyCreated', 'recentlyUpdated')
    .parameters({
      includeAssociations: {
        description: 'Include the IDs of the associated contacts and companies in the results',
        type: 'boolean'
      }
    })),
  factory.output(uri, selector, {
    headers: config.mapping.headers,
    query: config.mapping.query.extended((mapping) => mapping
      .asIs('includeAssociations'))
  }))

module.exports = {
  origin: 'hubspot',
  name: 'deals',
  schema,
  source
}
