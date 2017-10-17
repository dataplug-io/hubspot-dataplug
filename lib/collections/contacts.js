const dataplug = require('@dataplug/dataplug');
const config = require('../config');
const factory = require('../factory');

const collection = {
  origin: 'hubspot',
  name: 'contacts',
  // https://developers.hubspot.com/docs/methods/contacts/contacts-overview
  schema: {
    type: 'object',
    definitions: {
      'source-type': {
        enum: [
          'API',
          'FORM',
          'IMPORT',
          'ANALYTICS',
          'SALESFORCE',
          'CONTACTS_WEB',
          'CRM_UI',
          'MOBILE_IOS', 'MOBILE_ANDROID',
          'EMAIL',
          'WORKFLOWS',
          'SOCIAL',
          'COMPANIES',
          'DEALS',
          'ENGAGEMENTS',
          'INTEGRATION', 'INTEGRATIONS_PLATFORM',
          'MERGE_CONTACTS',
          'MERGE_COMPANIES ',
          'SALES', 'SIGNALS', 'SIDEKICK',
          'LEADIN',
          'BCC_TO_CRM', 'FORWARD_TO_CRM',
          'GMAIL_INTEGRATION',
          'SEQUENCES',
          'CALCULATED',
          'MIGRATION', 'WAL_INCREMENTAL', 'TASK', 'BATCH_UPDATE', 'BIDEN', 'DEFAULT', 'ASSISTS', 'PORTAL_USER_ASSOCIATOR', 'HEISENBERG', 'ACADEMY', 'SALES_MESSAGES', 'AVATARS_SERVICE', 'COMPANY_FAMILIES'
        ]
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
            value: {
              type: 'string'
            },
            versions: {
              type: 'array',
              items: {
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
              }
            }
          }
        },
        additionalProperties: false
      },
      'form-submissions': {
        type: 'array',
        items: {
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
        }
      },
      'list-memberships': {
        type: 'array',
        items: {
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
        }
      },
      'identity-profiles': {
        type: 'array',
        items: {
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
              }
            }
          }
        }
      },
      'merge-audits': {
        type: 'array',
        items: {
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
            merged_to_email: {
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
          }
        }
      }
    },
    required: ['portal-id', 'canonical-vid']
  },
  identity: ['portal-id', 'canonical-vid']
};

module.exports.collection = collection;
module.exports.source = dataplug.source(collection,
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
        //TODO: choices: ['value_only', 'value_and_history'],
        default: 'value_and_history'
      },
      formSubmissionMode: {
        description: 'Specifies which form submissions should be fetched',
        //TODO: choices: ['all', 'none', 'newest', 'oldest'],
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
