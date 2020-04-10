import { LitContext, CONTEXT_KEY_LOCALE } from "./LitContext";
import { mockStorage } from "./utils/localStorage";

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
  const context = new LitContext("en", mockStorage());
  expect(context).is.not.null;
  expect(context.getLocale()).equals("en");
});

it("should change locale Ok", function () {
  const context = new LitContext("en", mockStorage());
  expect(context.getLocale()).equals("en");
  context.setLocale("es");
  expect(context.getLocale()).equals("es");

  // Should retain original locale too.
  expect(context.getInitialLocale()).equals("en");
});

it("should be created now", function () {
  const now = Date.now();
  const context = new LitContext("en", mockStorage());
  expect(context.getCreatedAt() >= now).to.be.true;
});

it("should fallback to the initial locale", () => {
  const myMap = new Map<string, string>();
  const storage = {
    setItem: function (key: string, value: string) {
      myMap.set(key, value);
    },
    getItem: function (key: string) {
      return myMap.get(key);
    },
  };
  const context = new LitContext("en", storage);
  myMap.delete(CONTEXT_KEY_LOCALE);
  expect(context.getLocale()).to.equal("en");
});
