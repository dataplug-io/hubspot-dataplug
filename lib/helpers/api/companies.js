const https = require('https');
const { URL } = require('url');
const config = require('../../config');

function fetchCompanyProperties (params) {
  const { apikey } = params;
  const PATH = '/properties/v1/companies/properties';

  const url = new URL(PATH, config.API_URL);
  const requestOptions = {
    path: `${url.pathname}?hapikey=${apikey}`,
    port: url.port ? parseInt(url.port) : undefined,
    hostname: url.hostname
  };

  return new Promise((resolve, reject) => {
    https
      .request(requestOptions, (res) => {
        let result = '';
        res.on('data', (data) => {
          result += data;
        });
        res.on('end', () => {
          const companyProperties = JSON.parse(result);
          const propertyNames = companyProperties.map(property => property.name);

          resolve(propertyNames);
        });
      })
      .on('error', (reason) => {
        reject(reason);
      })
      .end();
  });
}

module.exports = { fetchCompanyProperties };
