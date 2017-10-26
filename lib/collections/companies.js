const Promise = require('bluebird');
const dataplug = require('@dataplug/dataplug');
const config = require('../config');
const factory = require('../factory');
const { fetchCompanyProperties } = require('../helpers/api/companies');

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

const getUri = (params) => {
  if (params.recentlyCreated) {
    return '/companies/v2/companies/recent/created';
  } else if (params.recentlyUpdated) {
    return '/companies/v2/companies/recent/modified';
  }

  return '/companies/v2/companies/paged';
};

const getSelector = (params) => {
  if (params.recentlyCreated || params.recentlyUpdated) {
    return '!.results.*'
  }

  return '!.companies.*';
};

const getMapping = (params) => {
  const paramsKeys = Object.keys(params);
  const mapping = {
    headers: config.mapping.headers,
    query: config.mapping.query.extended((mapping) => mapping
      .asIs('limit')
      .asIs('count')
      .asIs('offset')
      .asIs('properties')
      .asIs('propertiesWithHistory')
    )
  };

  if (
    (params.recentlyCreated || params.recentlyUpdated) ||
    (!paramsKeys.includes('includeAllProperties') && !paramsKeys.includes('includeAllPropertiesWithHistory'))
  ) {
    return mapping;
  }

  return fetchCompanyProperties(params).then((properties) => {
    if (paramsKeys.includes('includeAllProperties')) {
      mapping.query.remap('includeAllProperties', () => ({ properties }));
    }
    if (paramsKeys.includes('includeAllPropertiesWithHistory')) {
      mapping.query.remap('includeAllPropertiesWithHistory', () => ({ propertiesWithHistory: properties }));
    }

    return mapping;
  });
};

const source = dataplug.source(
  config.declaration.extended((declaration) => declaration
    .parameters({
      recentlyCreated: {
        description: 'Fetch companies which were created in the last 30 days, or the 10k most recently created records sorted by the date the companies were created.'
      },
      recentlyUpdated: {
        description: 'Fetch companies which were modified in the last 30 days, or the 10k most recently modified records sorted by the date the companies were most recently modified.'
      },
      properties: {
        description: 'Fetch companies with specific properties',
        type: 'string'
      },
      includeAllProperties: {
        description: 'Fetch companies with all properties',
        type: 'string'
      },
      propertiesWithHistory: {
        description: 'Fetch companies with specific properties including the whole history',
        type: 'string'
      },
      includeAllPropertiesWithHistory: {
        description: 'Fetch companies with all properties including the whole history',
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
  factory.output(getUri, getSelector, getMapping)
);

module.exports = {
  origin: 'hubspot',
  name: 'companies',
  schema,
  source
};
