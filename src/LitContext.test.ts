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

import { LitContext, CONTEXT_KEY_LOCALE } from "./LitContext";
import { getLocalStore } from "./utils/localStorage";

import chai from "chai";
const expect = chai.expect;

it("should fail if no locale provided", function () {
  expect(
    // @ts-ignore, because the parameters of the constructor
    // explicitely expect (string, IStore), to which (undef, undef) cannot
    // be assigned.
    () => new LitContext(undefined, undefined)
  ).to.throw("*MUST* be provided a locale");
});

it("should fail if no storage provided", function () {
  // @ts-ignore, because the parameters of the constructor
  // explicitely expect (string, IStore), to which (string, undef) cannot
  // be assigned.
  expect(() => new LitContext("en", undefined)).to.throw(
    "*MUST* be provided storage"
  );
});

it("should create Ok", function () {
  const context = new LitContext("en", getLocalStore());
  expect(context).is.not.null;
  expect(context.getLocale()).equals("en");
});

it("should change locale Ok", function () {
  const context = new LitContext("en", getLocalStore());
  expect(context.getLocale()).equals("en");
  context.setLocale("es");
  expect(context.getLocale()).equals("es");

  // Should retain original locale too.
  expect(context.getInitialLocale()).equals("en");
});

it("should be created now", function () {
  const now = Date.now();
  const context = new LitContext("en", getLocalStore());
  expect(context.getCreatedAt() >= now).to.be.true;
});

it("should fallback to the initial locale", () => {
  const store = getLocalStore();
  const context = new LitContext("en", store);
  // A value is initialized in the store when the context is created,
  // and to get the default initial locale this value must be removed.
  store.removeItem(CONTEXT_KEY_LOCALE);
  expect(context.getLocale()).to.equal("en");
});
