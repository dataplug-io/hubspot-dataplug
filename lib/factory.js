const _ = require('lodash');
const Promise = require('bluebird');
const https = require('https');
const querystring = require('querystring');
const {
  URL,
  URLSearchParams
} = require('url');
const {
  JsonSequentialStreamsReader
} = require('@dataplug/dataplug');
const config = require('./config');

/**
 * Creates output factory
 *
 * @param {string|Function} uri Collection URI or function returning it
 * @param {selector|Function} selector Collection entry selector or function returning it
 * @param {Object} mapping
 */
function declareOutputFactory(uri, selector = '!.*', mapping = config.mapping) {
  return (params) => {
    if (_.isFunction(uri)) {
      uri = uri(params);
    }
    if (_.isFunction(selector)) {
      selector = selector(params);
    }
    if (_.isFunction(mapping)) {
      mapping = mapping(params);
    }

    return new JsonSequentialStreamsReader(
      async(factoryParams, previousData) => new Promise((resolve, reject) => {
        if (previousData && !previousData['has-more']) {
          reject(null);
          return;
        }

        const factoryHeaders = mapping.headers.apply(factoryParams);
        const factoryQuery = mapping.query.apply(factoryParams);
        const previousDataHeaders = mapping.headers.apply(previousData || {});
        const previousDataQuery = mapping.query.apply(previousData || {});

        const url = new URL(uri, params.endpoint);
        url.search = querystring.stringify(Object.assign({}, factoryQuery, previousDataQuery));
        const requestOptions = {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port ? parseInt(url.port) : undefined,
          path: url.pathname + url.search,
          headers: Object.assign({}, factoryHeaders, previousDataHeaders)
        };

        https
          .request(requestOptions, (response) => {
            resolve(response);
          })
          .on('error', (reason) => {
            reject(reason);
          })
          .end();
      }),
      params,
      selector);
  };
}

module.exports = {
  output: declareOutputFactory,
}
