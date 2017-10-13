const dataplug = require('@dataplug/dataplug');
const https = require('https');
const hubspot = require('../hubspot');

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

// https://developers.hubspot.com/docs/methods/contacts/get_contacts
module.exports.source = dataplug.source(collection, class extends dataplug.JsonSourceOutput {
  async _init(params) {
    await super._init(params);

    this._entrySelector = '!.contacts.*';
  }

  /** @inheritdoc */
  _reset() {
    this._vidOffset = 0;
  }

  /** @inheritdoc */
  async _createInputStream() {
    const queryParams = {
      vidOffset: this._vidOffset,
      count: 100
    };
    const options = hubspot.buildRequestOptions('/contacts/v1/lists/all/contacts/all', this._params, queryParams);

    return new Promise((resolve, reject) => {
      https
        .request(options, (response) => {
          resolve(response);
        })
        .on('error', (reason) => {
          reject(reason);
        })
        .end();
    });
  }

  /** @inheritdoc */
  _configureNextInputStream(lastJson) {
    const hasMore = lastJson && !!lastJson['has-more'];
    if (hasMore) {
      this._vidOffset = lastJson['vid-offset'];
    }

    return hasMore;
  }
}, (yargs) => {
  return hubspot.buildCli(yargs)
  //TODO: propertyMode, formSubmissionMode, showListMemberships, property, vidOffset?, count?
  // .option('include-inactive', {
  //   describe: 'Include inactive owners (defined as owner without any active remotes)',
  //   type: 'boolean'
  // })
  // .option('email', {
  //   describe: 'Search for owners matching the specified email address',
  //   type: 'string'
  // });
});
