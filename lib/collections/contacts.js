const dataplug = require('@dataplug/dataplug');
const config = require('../config');
const factory = require('../factory');

// https://developers.hubspot.com/docs/methods/contacts/contacts-overview
const schema = {
  type: 'object',
  definitions: {
    'source-type': require('../types/source-type'),
    'contact-property': {
      type: 'object',
      properties: {
        value: {
          type: 'string'
        },
        versions: {
          type: 'array',
          items: {
            $ref: '#/definitions/contact-property-value-history'
          }
        }
      }
    },
    'contact-property-value-history': {
      type: 'object',
      properties: {
        value: {
          type: 'string'
        },
        'source-type': {
          $ref: '#/definitions/source-type'
        },
        'source-id': {
          type: ['string', 'null']
        },
        'source-label': {
          type: ['string', 'null']
        },
        timestamp: {
          type: 'integer'
        },
        selected: {
          type: 'boolean'
        },
      }
    },
    'form-submission': {
      type: 'object',
      properties: {
        'conversion-id': {
          type: 'string'
        },
        timestamp: {
          type: 'integer'
        },
        'form-id': {
          type: 'string'
        },
        'portal-id': {
          type: 'integer'
        },
        'page-url': {
          type: 'string'
        },
        title: {
          type: 'string'
        },
        'meta-data': {
          type: 'array',
          items: {
            type: 'object'
          }
        }
      }
    },
    'list-membership': {
      type: 'object',
      properties: {
        'static-list-id': {
          type: 'integer'
        },
        'internal-list-id': {
          type: 'integer'
        },
        timestamp: {
          type: 'integer'
        },
        vid: {
          type: 'integer'
        },
        'is-member': {
          type: 'boolean'
        }
      }
    },
    'identity-profile': {
      type: 'object',
      properties: {
        vid: {
          type: 'integer'
        },
        'saved-at-timestamp': {
          type: 'integer'
        },
        'deleted-changed-timestamp': {
          type: 'integer'
        },
        identities: {
          type: 'array',
          items: {
            $ref: '#/definitions/identity-profile-identity'
          }
        }
      }
    },
    'identity-profile-identity': {
      type: 'object',
      properties: {
        type: {
          type: 'string'
        },
        value: {
          type: 'string'
        },
        timestamp: {
          type: 'integer'
        }
      }
    },
    'merge-audit': {
      type: 'object',
      properties: {
        'canonical-vid': {
          type: 'integer'
        },
        'vid-to-merge': {
          type: 'integer'
        },
        timestamp: {
          type: 'integer'
        },
        'entity-id': {
          type: 'string'
        },
        'user-id': {
          type: 'integer'
        },
        'num-properties-moved': {
          type: 'integer'
        },
        merged_from_email: {
          $ref: '#/definitions/merge-audit-merged-from-email'
        },
        merged_to_email: {
          $ref: '#/definitions/merge-audit-merged-to-email'
        }
      }
    },
    'merge-audit-merged-from-email': {
      type: 'object',
      properties: {
        value: {
          type: 'string'
        },
        'source-type': {
          $ref: '#/definitions/source-type'
        },
        'source-id': {
          type: ['string', 'null']
        },
        'source-label': {
          type: ['string', 'null']
        },
        'source-vids': {
          type: 'array',
          items: {
            type: 'integer'
          }
        },
        timestamp: {
          type: 'integer'
        },
        selected: {
          type: 'boolean'
        }
      }
    },
    'merge-audit-merged-to-email': {
      type: 'object',
      properties: {
        value: {
          type: 'string'
        },
        'source-type': {
          $ref: '#/definitions/source-type'
        },
        'source-id': {
          type: ['string', 'null']
        },
        'source-label': {
          'type': ['string', 'null']
        },
        timestamp: {
          type: 'integer'
        },
        selected: {
          type: 'boolean'
        }
      }
    }
  },
  properties: {
    vid: {
      type: 'integer'
    },
    'canonical-vid': {
      type: 'integer'
    },
    'merged-vids': {
      type: 'array',
      items: {
        type: 'integer'
      }
    },
    'portal-id': {
      type: 'integer'
    },
    'is-contact': {
      type: 'boolean'
    },
    'profile-token': {
      type: 'string'
    },
    'profile-url': {
      type: 'string'
    },
    properties: {
      type: 'object',
      patternProperties: {
        '^.*$': {
          $ref: '#/definitions/contact-property'
        }
      },
      additionalProperties: false
    },
    'form-submissions': {
      type: 'array',
      items: {
        $ref: '#/definitions/form-submission'
      }
    },
    'list-memberships': {
      type: 'array',
      items: {
        $ref: '#/definitions/list-membership'
      }
    },
    'identity-profiles': {
      type: 'array',
      items: {
        $ref: '#/definitions/identity-profile'
      }
    },
    'merge-audits': {
      type: 'array',
      items: {
        $ref: '#/definitions/merge-audit'
      }
    }
  },
  required: ['portal-id', 'canonical-vid']
};

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
    .conflicts('recentlyCreated', 'recentlyCreated')
    .parameters({
      propertyMode: {
        description: 'Fetch only property current value or with historical values',
        enum: ['value_only', 'value_and_history'],
        default: 'value_and_history'
      },
      formSubmissionMode: {
        description: 'Specifies which form submissions should be fetched',
        enum: ['all', 'none', 'newest', 'oldest'],
        default: 'all'
      },
      showListMemberships: {
        description: 'List current contact memberships or no',
        type: 'boolean',
        default: 'true'
      },
      //TODO: support property-mode
      //       .option('property', {
      //         describe: 'Only fetch property specified',
      //         type: 'string'
      //       },
      chunkSize: {
        description: 'Size of data chunk to transfer',
        type: 'integer',
        default: 100
      }
    })),
  factory.output(
    (params) => {
      if (params.recentlyCreated) {
        return '/contacts/v1/lists/all/contacts/recent';
      } else if (params.recentlyUpdated) {
        return '/contacts/v1/lists/recently_updated/contacts/recent';
      }

      return '/contacts/v1/lists/all/contacts/all';
    }, '!.contacts.*', {
      headers: config.mapping.headers,
      query: config.mapping.query.extended((mapping) => mapping
        .asIs('propertyMode')
        .asIs('formSubmissionMode')
        .asIs('showListMemberships')
        .rename('chunkSize', 'count'))
    }));

module.exports = {
  origin: 'hubspot',
  name: 'contacts',
  schema,
  source
};
