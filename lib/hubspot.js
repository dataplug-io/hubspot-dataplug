const querystring = require('querystring');

const ENDPOINT = {
  protocol: 'https:',
  hostname: 'api.hubapi.com',
  path: ''
};

function buildCli(yargs) {
  return yargs
    .option('key', {
      describe: 'API key',
      type: 'string'
    })
    .option('token', {
      describe: 'OAuth 2.0 access token',
      type: 'string'
    })
    .conflicts('key', 'token')
    .check((argv, options) => {
      if (!argv.key && !argv.token) {
        throw new Error('Not enough non-option arguments: key or token must be specified');
      }

      return true;
    });
}

function buildRequestOptions(uri, params, queryParams) {
  let qs = {};
  let headers = {};

  if (params.token) {
    headers['Authorization'] = `Bearer ${params.token}`;
  }
  if (params.key) {
    qs['hapikey'] = params.key;
  }

  let options = Object.assign({}, ENDPOINT);

  options.path += uri;
  const formattedQs = querystring.stringify(Object.assign({}, qs, queryParams));
  if (!!formattedQs && formattedQs.length > 0) {
    options.path += '?' + formattedQs;
  }

  options.headers = Object.assign({}, options.headers, headers);

  return options;
}

module.exports = {
  ENDPOINT: ENDPOINT,
  buildCli: buildCli,
  buildRequestOptions: buildRequestOptions
};
