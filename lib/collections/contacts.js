const { URL } = require('url')
const moment = require('moment')
const { Source, Mapper } = require('@dataplug/dataplug')
const { HttpGetReader, PagedHttpGetReader } = require('@dataplug/dataplug-http')
const { JsonStreamReader } = require('@dataplug/dataplug-json')
const responseHandlerFactory = require('../responseHandlerFactory')
const config = require('../config')

// https://developers.hubspot.com/docs/methods/contacts/contacts-overview
const schema = {
  type: 'object',
  definitions: {
    sourceType: {
      type: ['string', 'null']
    },
    property: {
      type: 'object',
      properties: {
        value: {
          type: 'string'
        },
        versions: {
          type: 'array',
          items: {
            $ref: '#/definitions/valueHistory'
          }
        }
      },
      additionalProperties: false
    },
    valueHistory: {
      type: 'object',
      properties: {
        value: {
          type: 'string'
        },
        'source-type': {
          $ref: '#/definitions/sourceType'
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
        }
      },
      additionalProperties: false,
      required: ['timestamp']
    },
    formSubmission: {
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
        'form-type': {
          type: 'string'
        },
        'portal-id': {
          type: 'integer'
        },
        'page-url': {
          type: 'string'
        },
        'page-title': {
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
      },
      additionalProperties: false,
      required: ['timestamp']
    },
    listMembership: {
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
      },
      additionalProperties: false
    },
    identityProfile: {
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
            $ref: '#/definitions/identity'
          }
        }
      },
      additionalProperties: false,
      required: ['vid']
    },
    identity: {
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
        },
        'is-primary': {
          type: 'boolean'
        }
      },
      additionalProperties: false
    },
    mergeAudit: {
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
          $ref: '#/definitions/mergedFromEmail'
        },
        merged_to_email: {
          $ref: '#/definitions/mergedToEmail'
        }
      },
      additionalProperties: false,
      required: ['timestamp']
    },
    mergedFromEmail: {
      type: 'object',
      properties: {
        value: {
          type: 'string'
        },
        sourceType: {
          $ref: '#/definitions/sourceType'
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
      },
      additionalProperties: false
    },
    mergedToEmail: {
      type: 'object',
      properties: {
        value: {
          type: 'string'
        },
        sourceType: {
          $ref: '#/definitions/sourceType'
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
        }
      },
      additionalProperties: false
    },
    associatedCompanyProperty: {
      type: 'object',
      properties: {
        value: {
          type: 'string'
        }
      }
    },
    associatedCompany: {
      type: 'object',
      properties: {
        'portal-id': {
          type: 'integer'
        },
        'company-id': {
          type: 'integer'
        },
        properties: {
          type: 'object',
          patternProperties: {
            '^.*$': {
              $ref: '#/definitions/associatedCompanyProperty'
            }
          },
          additionalProperties: false
        }
      },
      additionalProperties: false,
      required: ['portal-id', 'company-id']
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
          $ref: '#/definitions/property'
        }
      },
      additionalProperties: false
    },
    'form-submissions': {
      type: 'array',
      items: {
        $ref: '#/definitions/formSubmission'
      }
    },
    'list-memberships': {
      type: 'array',
      items: {
        $ref: '#/definitions/listMembership'
      }
    },
    'identity-profiles': {
      type: 'array',
      items: {
        $ref: '#/definitions/identityProfile'
      }
    },
    'merge-audits': {
      type: 'array',
      items: {
        $ref: '#/definitions/mergeAudit'
      }
    },
    'associated-company': {
      $ref: '#/definitions/associatedCompany'
    }
  },
  additionalProperties: false,
  required: ['portal-id', 'canonical-vid']
}

const earliestSince = moment()
  .subtract(30, 'days')
  .add(1, 'seconds')
  .milliseconds(0)
const configDeclaration = config.declaration.extended((declaration) => declaration
  .parameters({
    recently: {
      description: 'Fetch only recent comapneis in descending order by date',
      enum: ['created', 'updated']
    },
    since: {
      description: 'Date and time to query data since',
      type: 'string',
      format: 'date-time',
      default: earliestSince.format()
    },
    propertyMode: {
      description: 'Fetch only property current value or with historical values',
      enum: ['value_only', 'value_and_history'],
      default: 'value_and_history'
    },
    formSubmissionMode: {
      description: 'Specifies which form submissions should be fetched',
      enum: ['all', 'none', 'newest', 'oldest'],
      default: 'all'
    },
    showListMemberships: {
      description: 'List current contact memberships or no',
      type: 'boolean',
      default: true
    },
    property: {
      describe: 'Only fetch property specified, by default all are fetched',
      type: 'array',
      item: 'string'
    }
  })
  // TODO: implies('since', 'recently')
)

const contactsQueryMapping = config.mapping.query.extended((mapping) => mapping
  .asIs('propertyMode')
  .asIs('formSubmissionMode')
  .asIs('showListMemberships')
  .default('count', () => 100))

const contactDetailsQueryMapping = config.mapping.query.extended((mapping) => mapping
  .asIs('propertyMode')
  .asIs('formSubmissionMode')
  .asIs('showListMemberships'))

const factory = (params) => {
  let uri = '/contacts/v1/lists/all/contacts/all'
  if (params.recently === 'created') {
    uri = '/contacts/v1/lists/all/contacts/recent'
  } else if (params.recently === 'updated') {
    uri = '/contacts/v1/lists/recently_updated/contacts/recent'
  }

  const since = moment(params.since)
  if (since.diff(earliestSince) < 0) {
    throw new Error(`Invalid range: since ${since} can not be before ${earliestSince}`)
  }

  const url = new URL(uri, params.endpoint)
  const nextPage = (page, data) => {
    if (data && data['has-more']) {
      const vidOffset = data['vid-offset']
      page.query['vidOffset'] = vidOffset

      // Used in recentlyCreated & recentlyUpdated modes
      const timeOffset = data['time-offset']
      if (timeOffset) {
        if (since.valueOf() > timeOffset) {
          return false
        }
        page.query['timeOffset'] = timeOffset
      }

      return true
    }
    return false
  }
  const transformFactory = () => new JsonStreamReader('!.contacts.*')
  const query = contactsQueryMapping.apply(params)
  const headers = config.mapping.headers.apply(params)
  const responseHandler = responseHandlerFactory(params)

  const detailsMapper = (contact) => {
    if (!contact || (contact.addedAt && since.valueOf() > contact.addedAt)) {
      return
    }
    const url = new URL(`/contacts/v1/contact/vid/${contact.vid}/profile`, params.endpoint)
    const query = contactDetailsQueryMapping.apply(params)
    const headers = config.mapping.headers.apply(params)

    const transform = new JsonStreamReader('!')
    return new HttpGetReader(url, {
      transform,
      query,
      headers,
      responseHandler
    })
  }

  const contactsStream = new PagedHttpGetReader(url, nextPage, {
    transformFactory,
    query,
    headers,
    responseHandler
  })
  const mappedStream = new Mapper(detailsMapper)
  contactsStream
    .pipe(mappedStream)
  return [contactsStream, mappedStream]
}

const source = new Source(configDeclaration, factory)

module.exports = {
  origin: 'hubspot',
  name: 'contacts',
  schema,
  source
}
