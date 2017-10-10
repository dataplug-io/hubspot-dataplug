const dataplug = require('dataplug');
const https = require('https');
const hubspot = require('../hubspot');

const collection = {
  origin: 'hubspot',
  name: 'contacts',
  schema: {
    'type': 'object',
    'properties': {
    },
    'required': []
  },
  identity: []
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
