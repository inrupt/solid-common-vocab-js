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

import { VocabContext, CONTEXT_KEY_LOCALE } from "./VocabContext";
import { getLocalStore } from "./util/localStorage";

import expect from "expect";

it("should fail if no locale provided", function () {
  expect(
    // @ts-ignore, because the parameters of the constructor
    // explicitely expect (string, IStore), to which (undef, undef) cannot
    // be assigned.
    () => new VocabContext(undefined, undefined)
  ).toThrowError("*MUST* be provided a locale");
});

it("should fail if no storage provided", function () {
  // @ts-ignore, because the parameters of the constructor
  // explicitely expect (string, IStore), to which (string, undef) cannot
  // be assigned.
  expect(() => new VocabContext("en", undefined)).toThrowError(
    "*MUST* be provided storage"
  );
});

it("should create Ok", function () {
  const context = new VocabContext("en", getLocalStore());
  expect(context).not.toBeNull();
  expect(context.getLocale()).toBe("en");
});

it("should change locale Ok", function () {
  const context = new VocabContext("en", getLocalStore());
  expect(context.getLocale()).toBe("en");
  context.setLocale("es");
  expect(context.getLocale()).toBe("es");

  // Should retain original locale too.
  expect(context.getInitialLocale()).toBe("en");
});

it("should be created now", function () {
  const now = Date.now();
  const context = new VocabContext("en", getLocalStore());
  expect(context.getCreatedAt() >= now).toBe(true);
});

it("should fallback to the initial locale", () => {
  const store = getLocalStore();
  const context = new VocabContext("en", store);
  // A value is initialized in the store when the context is created,
  // and to get the default initial locale this value must be removed.
  store.removeItem(CONTEXT_KEY_LOCALE);
  expect(context.getLocale()).toBe("en");
});
