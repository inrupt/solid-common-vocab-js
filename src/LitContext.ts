/**
 * Proprietary and Confidential
 *
 * Copyright 2020 Inrupt Inc. - all rights reserved.
 *
 * Do not use without explicit permission from Inrupt Inc.
 */

import { Store } from "./utils/localStorage";

const CONTEXT_KEY_LOCALE: string = "i18nextLng";

// Key that specifies a preferred fallback language - e.g. if the user selects
// 'French' as the language for the current page, but there is no French, then
// we'll check if the user has a preferred fallback language, e.g. maybe in
// their profile they have selected 'Spanish' as their preferred fallback.
const CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE: string =
  "lang_preferred_fallback";

/**
 * Simple class to hold 'context', which could include things like a chosen language, localization settings, process
 * details (like the credentials of the process, time the process started, the process ID, etc.).
 *
 * We can be configured with a storage instance on construction (e.g. to attempt to read values from 'localStorage' in
 * cases when we are deployed within a browser - e.g. a language drop-down might set the current language using a
 * simple key value of say 'i18nLanguage' in localStorage).
 */
class LitContext {
  _initialLocale: string;
  _storage: Store;
  _createdAt: number;

  constructor(locale: string, storage: Store) {
    if (!locale) {
      throw new Error(
        "A new context *MUST* be provided a locale, but none was provided."
      );
    }
    if (!storage) {
      throw new Error(
        `A new context *MUST* be provided storage (we expect 'localStorage').`
      );
    }

    this._initialLocale = locale;
    this._storage = storage;

    this._storage.setItem(CONTEXT_KEY_LOCALE, locale);
    this._createdAt = Date.now();
  }

  getLocale(): string {
    return this._storage.getItem(CONTEXT_KEY_LOCALE) ?? this._initialLocale;
  }

  setLocale(locale: string): LitContext {
    this._storage.setItem(CONTEXT_KEY_LOCALE, locale);
    return this;
  }

  getInitialLocale(): string {
    return this._initialLocale;
  }

  getCreatedAt(): number {
    return this._createdAt;
  }
}

export {
  LitContext,
  CONTEXT_KEY_LOCALE,
  CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE,
};
