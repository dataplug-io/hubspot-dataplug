const _ = require('lodash');
const Promise = require('bluebird');
const https = require('https');
const querystring = require('querystring');
const {
  URL,
  URLSearchParams
} = require('url');
const {
  JsonSourceOutput
} = require('@dataplug/dataplug');
const config = require('./config');

/**
 * Creates output factory
 *
 * @param {string|Function} uri Collection URI or function returning it
 * @param {selector|Function} selector Collection entry selector or function returning it
 * @param {Object} mapping
 */
function createOutputFactory(uri, selector = '!.*', mapping = config.mapping) {
  //TODO: extract
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

    const mappedHeaders = mapping.headers.apply(params);
    const mappedQuery = mapping.query.apply(params);
    const url = new URL(uri, params.endpoint);
    url.search = querystring.stringify(mappedQuery);
    const requestOptions = {
      protocol: url.protocol,
      hostname: url.hostname,
      port: url.port ? parseInt(url.port) : undefined,
      path: url.pathname + url.search
    };

    return new JsonSourceOutput(params, selector,
      async() => new Promise((resolve, reject) => https
        .request(requestOptions, (response) => {
          resolve(response);
        })
        .on('error', (reason) => {
          reject(reason);
        })
        .end()
      ),
      function(previousData) {
        const hasMore = previousData && !!previousData['has-more'];
        if (!hasMore) {
          return false;
        }

        return {
          vidOffset: previousData['vid-offset']
        };
      });
  };
}

module.exports = {
  output: createOutputFactory,
}
