'use strict'

const moment = require('moment')

const CONTEXT_KEY_LOCALE = 'i18nextLng'

/**
 * Simple class to hold 'context', which could include things like a chosen language, localization settings, process
 * details (like the credentials of the process, time the process started, the process ID, etc.).
 *
 * We can be configured with a storage instance on construction (e.g. to attempt to read values from 'localStorage' in
 * cases when we are deployed within a browser - e.g. a language drop-down might set the current language using a
 * simple key value of say 'i18nLanguage' in localStorage).
 */
class LitContext {
  constructor (locale, storage) {
    if (!locale) {
      throw new Error('A new context *MUST* be provided a locale, but none was provided.')
    }

    if (!storage) {
      throw new Error(`A new context *MUST* be provided storage (we expect 'localStorage').`)
    }

    this._initialLocale = locale

    this._storage = storage
    this._storage.setItem(CONTEXT_KEY_LOCALE, locale)

    this._createdAt = moment().valueOf()
  }

  getLocale () {
    return this._storage.getItem(CONTEXT_KEY_LOCALE)
  }

  setLocale (locale) {
    this._storage.setItem(CONTEXT_KEY_LOCALE, locale)
    return this
  }

  getInitialLocale () {
    return this._initialLocale
  }

  getCreatedAt () {
    return this._createdAt
  }
}

module.exports = LitContext
module.exports.CONTEXT_KEY_LOCALE = CONTEXT_KEY_LOCALE
