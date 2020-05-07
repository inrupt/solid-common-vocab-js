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

import { LitContext } from "./LitContext";
import { LitContextError } from "./LitContextError";
import { getLocalStore } from "./utils/localStorage";

import chai from "chai";
const expect = chai.expect;

describe("LIT context-aware errors", () => {
  beforeEach(() => {
    delete process.env.NODE_ENV;
  });

  it("should fail if wrapped exception is not an Error", function () {
    const context = new LitContext("en", getLocalStore());
    expect(
      // @ts-ignore, because the parameters of the constructor
      // explicitly expect (string, Error), to which (string, string) cannot
      // be assigned.
      () => new LitContextError(context, "test", "Not an error!")
    ).to.throw("test");
    expect(
      // @ts-ignore
      () => new LitContextError(context, "test", "Not an error!")
    ).to.throw("Not an error!");
  });

  it("should be possible to create without a wrapped error", function () {
    const context = new LitContext("en", getLocalStore());
    expect(new LitContextError(context, "test", undefined)).to.not.be.null;
  });

  it("should be able to wrap a standard error", function () {
    const context = new LitContext("en", getLocalStore());
    const message = "Error occurred";
    const wrapMessage = "Wrap error message";
    const wrapError = new LitContextError(
      context,
      wrapMessage,
      new Error(message)
    );

    expect(wrapError.countLevels()).to.equal(2);

    const fullReport = wrapError.unwrapException();
    expect(fullReport).to.include(message);
    expect(fullReport).to.include(wrapMessage);
  });

  it("should contain wrapped exception details", function () {
    const context = new LitContext("en", getLocalStore());
    const errorLvl1 = new LitContextError(
      context,
      "Error message Level1",
      undefined
    );
    const errorLvl2 = new LitContextError(
      context,
      "Error message Level2",
      errorLvl1
    );
    const errorLvl3 = new LitContextError(
      context,
      "Error message Level3",
      errorLvl2
    );
    expect(errorLvl3.countLevels()).to.equal(3);
    const fullReport = errorLvl3.unwrapException();
    expect(fullReport).to.include("Error message Level1");
    expect(fullReport).to.include("Error message Level2");
    expect(fullReport).to.include("Error message Level3");
  });

  it("throwing a standard error loses nested information", function () {
    const context = new LitContext("en", getLocalStore());
    const errorLvl1 = new LitContextError(
      context,
      "Error message Level1",
      undefined
    );
    const errorLvl2 = new Error("Standard Error message Level2");
    const errorLvl3 = new LitContextError(
      context,
      "Error message Level3",
      errorLvl2
    );
    const errorLvl4 = new LitContextError(
      context,
      "Error message Level4",
      errorLvl3
    );

    expect(errorLvl4.countLevels()).to.equal(3);
    const fullReport = errorLvl4.unwrapException();
    expect(fullReport).to.not.include(errorLvl1.message);
    expect(fullReport).to.include("Standard Error message Level2");
    expect(fullReport).to.include("Error message Level3");
    expect(fullReport).to.include("Error message Level4");
  });

  it("should contain wrapped exception details, but no stack info", function () {
    const context = new LitContext("en", getLocalStore());
    process.env.NODE_ENV = "production";
    const errorLvl1 = new LitContextError(
      context,
      "Error message Level1",
      undefined
    );
    const errorLvl2 = new LitContextError(
      context,
      "Error message Level2",
      errorLvl1
    );
    const errorLvl3 = new LitContextError(
      context,
      "Error message Level3",
      errorLvl2
    );

    expect(errorLvl3.countLevels()).to.equal(3);
    const fullReport = errorLvl3.unwrapException();
    expect(fullReport).to.include("Error message Level1");
    expect(fullReport).to.include("Error message Level2");
    expect(fullReport).to.include("Error message Level3");

    expect(fullReport).to.not.include("Level ");
  });

  it("should unwrap when calling toString()", function () {
    const context = new LitContext("en", getLocalStore());
    const message = "Error occurred";
    try {
      throw new Error(message);
    } catch (error) {
      const wrapMessage = "Wrap error message";
      const wrapError = new LitContextError(context, wrapMessage, error);
      expect(wrapError.countLevels()).to.equal(2);

      const fullReport = wrapError.toString();
      expect(fullReport).to.include(message);
      expect(fullReport).to.include(wrapMessage);
    }
  });

  it("should check if our error contains specified values", function () {
    const context = new LitContext("en", getLocalStore());
    const message = "Error occurred";
    try {
      throw new LitContextError(context, message, undefined);
    } catch (error) {
      expect(error.contains(["Error"])).to.be.true;
      expect(error.contains(["Error", "occurred"])).to.be.true;
      expect(error.contains(["Error", "does not", "occurred"])).to.be.false;
    }
  });

  it("should return true if we don't actually check for any arguments", function () {
    const context = new LitContext("en", getLocalStore());
    const message = "Error occurred";
    try {
      throw new LitContextError(context, message, undefined);
    } catch (error) {
      expect(error.contains()).to.be.true;
    }
  });

  it("should not throw on an empty stack", function () {
    const context = new LitContext("en", getLocalStore());
    const message = "Error occurred";
    const error = new LitContextError(context, message, undefined);
    error.stack = undefined;
    expect(error.unwrapException()).to.contain(message);
  });

  it("should not show the whole stack in production", () => {
    if (process?.env) {
      process.env.NODE_ENV = "production";
      const context = new LitContext("en", getLocalStore());
      const message = "Error occurred";
      const error = new LitContextError(context, message, undefined);
      const prodReport = error.unwrapException();
      process.env.NODE_ENV = "staging";
      const stagingReport = error.unwrapException();
      expect(prodReport).to.not.equal(stagingReport);
    }
  });

  it("should support non-Node environment", () => {
    const context = new LitContext("en", getLocalStore());
    const message = "Error occurred";
    const error = new LitContextError(context, message, undefined);
    expect(() => error.unwrapException()).not.to.throw();
  });
});
