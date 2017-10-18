const dataplug = require('@dataplug/dataplug');
const config = require('../config');
const factory = require('../factory');

const schema = {
  type: 'object',
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
    hasContactsAccess: {
      type: ['boolean', 'null']
    },
    remoteList: {
      type: ['array', 'null'],
      items: {
        type: 'object',
        properties: {
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
        }
      }
    }
  },
  required: ['portalId', 'ownerId']
};

const source = dataplug.source(
  config.declaration.extended((declaration) => declaration
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
    })),
  factory.output('/owners/v2/owners/', '!.*', {
    headers: config.mapping.headers,
    query: config.mapping.query.extended((mapping) => mapping
      .asIs('includeInactive')
      .asIs('email'))
  }));

module.exports = {
  origin: 'hubspot',
  name: 'owners',
  schema,
  source
};
