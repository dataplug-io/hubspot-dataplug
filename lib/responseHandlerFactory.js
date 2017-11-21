const Promise = require('bluebird')
const logger = require('winston')
const { HttpGetReader } = require('@dataplug/dataplug-http')

function responseHandlerFactory (params) {
  return (response, request) => {
    if (response.statusCode === 429) {
      let body = ''
      request
        .on('data', (data) => { body += data })
      return new Promise((resolve, reject) => {
        request
          .on('error', reject)
          .on('end', resolve)
      })
        .then(() => {
          const jsonBody = JSON.parse(body)
          if (jsonBody.policyName === 'SECONDLY') {
            return new Promise((resolve) => {
              logger.log('info', 'Going to retry in 1 second')
              setTimeout(() => resolve(false), 1 * 1000)
            })
          }

          return new Promise((resolve) => {
            logger.log('info', 'Going to retry in 1 hour')
            setTimeout(() => resolve(false), 1 * 60 * 60 * 1000)
          })
        })
    }

    return HttpGetReader.defaultResponseHandler(response)
  }
}

module.exports = responseHandlerFactory
