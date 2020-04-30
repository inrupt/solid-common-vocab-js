/**
 * Proprietary and Confidential
 *
 * Copyright 2020 Inrupt Inc. - all rights reserved.
 *
 * Do not use without explicit permission from Inrupt Inc.
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
