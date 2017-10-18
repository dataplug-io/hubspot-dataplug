const dataplug = require('@dataplug/dataplug');

const declaration = dataplug.config.declare
  .parameters({
    endpoint: {
      description: 'API endpoint',
      type: 'string',
      default: 'https://api.hubapi.com'
    },
    apikey: {
      description: 'API key',
      type: 'string'
    },
    token: {
      description: 'OAuth 2.0 access token',
      type: 'string'
    }
  })
  .conflicts('apikey', 'token');
//TODO: key OR token is required
// something like .conflicts('no-apikey', 'no-token');
// .check((argv, options) => {
//   if (!argv.key && !argv.token) {
//     throw new Error('Not enough non-option arguments: key or token must be specified');
//   }
//
//   return true;
// });

const headersMapping = dataplug.config.mapping
  .map('token', (value, parameterName) => {
    if (!value) {
      return;
    }
    return {
      'Authorization': `Bearer ${value}`
    }
  });
const queryMapping = dataplug.config.mapping
  .map('apikey', (value, parameterName) => {
    if (!value) {
      return;
    }
    return {
      'hapikey': value
    }
  });

module.exports = {
  declaration,
  mapping: {
    headers: headersMapping,
    query: queryMapping
  }
}
