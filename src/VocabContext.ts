/**
 * Begin license text.
 * Copyright 2020 Inrupt Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal in
 * the Software without restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the
 * Software, and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
 * INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
 * PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 *
 * End license text.Source Distributions
 */

import { Store } from "./util/localStorage";

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
class VocabContext {
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

  setLocale(locale: string): VocabContext {
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
  VocabContext,
  CONTEXT_KEY_LOCALE,
  CONTEXT_KEY_PREFERRED_FALLBACK_LANGUAGE,
};
