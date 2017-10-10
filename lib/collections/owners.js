const dataplug = require('dataplug');
const https = require('https');
const hubspot = require('../hubspot');

const collection = {
  origin: 'hubspot',
  name: 'owners',
  schema: {
    'type': 'object',
    'properties': {
      'portalId': {
        'type': 'integer'
      },
      'ownerId': {
        'type': 'integer'
      },
      'type': {
        'type': 'string'
      },
      'firstName': {
        'type': 'string'
      },
      'lastName': {
        'type': 'string'
      },
      'email': {
        'type': 'string',
        'format': 'email'
      },
      'createdAt': {
        'type': 'integer'
      },
      'signature': {
        'type': ['string', 'null']
      },
      'updatedAt': {
        'type': 'integer'
      },
      'hasContactsAccess': {
        'type': ['boolean', 'null']
      },
      'remoteList': {
        'type': ['array', 'null'],
        'items': {
          'type': 'object',
          'properties': {
            'portalId': {
              'type': 'integer'
            },
            'ownerId': {
              'type': 'integer'
            },
            'remoteId': {
              'type': 'string'
            },
            'remoteType': {
              'type': 'string'
            },
            'active': {
              'type': 'boolean'
            }
          }
        }
      }
    },
    'required': ['portalId', 'ownerId']
  },
  identity: ['portalId', 'ownerId']
};

// https://developers.hubspot.com/docs/methods/owners/get_owners
module.exports.source = dataplug.source(collection, class extends dataplug.JsonSourceOutput {
  async _init(params) {
    await super._init(params);

    this._options = hubspot.buildRequestOptions('/owners/v2/owners/', params);
  }

  /** @inheritdoc */
  async _createInputStream() {
    return new Promise((resolve, reject) => {
      https
        .request(this._options, (response) => {
          resolve(response);
        })
        .on('error', (reason) => {
          reject(reason);
        })
        .end();
    });
  }
}, (yargs) => {
  return hubspot.buildCli(yargs)
    .option('include-inactive', {
      describe: 'Include inactive owners (defined as owner without any active remotes)',
      type: 'boolean'
    })
    .option('email', {
      describe: 'Search for owners matching the specified email address',
      type: 'string'
    });
});
