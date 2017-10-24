const dataplug = require('@dataplug/dataplug');
const config = require('../config');
const factory = require('../factory');

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
    },
  },
  additionalProperties: false,
  required: ['portalId', 'companyId']
};

const source = dataplug.source(
  config.declaration.extended((declaration) => declaration
    .parameters({
      recentlyCreated: {
        description: 'Fetch companies which were created in the last 30 days, or the 10k most recently created records sorted by the date the companies were created.'
      },
      recentlyUpdated: {
        description: 'Fetch companies which were modified in the last 30 days, or the 10k most recently modified records sorted by the date the companies were most recently modified.'
      }
    })
    .conflicts('recentlyCreated', 'recentlyCreated')
    .parameters({
      properties: {
        description: 'Fetch company properties',
        type: 'string'
      },
      propertiesWithHistory: {
        description: 'Fetch company properties with the history',
        type: 'string'
      },
      limit: {
        description: 'Used to specify size of data chunk to transfer all companies',
        type: 'integer',
        default: 100
      },
      count: {
        description: 'Used to specify size of data chunk to transfer recently created and updated companies',
        type: 'integer',
        default: 100
      },
      offset: {
        description: 'Used to specify size of data chunk to skip on the next page',
        type: 'integer',
        default: 0
      }
    })
  ),
  factory.output(
    (params) => {
      if (params.recentlyCreated) {
        return '/companies/v2/companies/recent/created';
      } else if (params.recentlyUpdated) {
        return '/companies/v2/companies/recent/modified';
      }

      return '/companies/v2/companies/paged';
    }, '!.companies.*', {
      headers: config.mapping.headers,
      query: config.mapping.query.extended((mapping) => mapping
        .asIs('limit')
        .asIs('count')
        .asIs('offset')
        .asIs('properties')
        .asIs('propertiesWithHistory')
      )
    }
  )
);

module.exports = {
  origin: 'hubspot',
  name: 'companies',
  schema,
  source
};
