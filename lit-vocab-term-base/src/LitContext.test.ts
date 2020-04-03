import { LitContext, IStore } from "./LitContext";

import moment from "moment";

import chai from "chai";
const expect = chai.expect;

// Storage Mock
function storageMock(): IStore {
  let storage = new Map<string, string>();
  return {
    setItem: function (key: string, value: string) {
      storage.set(key, value);
    },
    getItem: function (key: string) {
      return storage.get(key);
    },
  };
}

describe("LitContext tests", () => {
  it("should fail if no locale provided", function () {
    // @ts-ignore
    expect(() => new LitContext(undefined, undefined)).to.throw(
      "*MUST* be provided a locale"
    );
  });

  it("should fail if no storage provided", function () {
    // @ts-ignore
    expect(() => new LitContext("en", undefined)).to.throw(
      "*MUST* be provided storage"
    );
  });

  it("should create Ok", function () {
    const context = new LitContext("en", storageMock());
    expect(context).is.not.null;
    expect(context.getLocale()).equals("en");
  });

  it("should change locale Ok", function () {
    const context = new LitContext("en", storageMock());
    expect(context.getLocale()).equals("en");
    context.setLocale("es");
    expect(context.getLocale()).equals("es");

    // Should retain original locale too.
    expect(context.getInitialLocale()).equals("en");
  });

  it("should be created now", function () {
    const now = moment().valueOf();
    const context = new LitContext("en", storageMock());
    expect(context.getCreatedAt() >= now).to.be.true;
  });
});
