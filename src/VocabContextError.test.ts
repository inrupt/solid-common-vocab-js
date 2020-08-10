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

import { VocabContext } from "./VocabContext";
import { VocabContextError } from "./VocabContextError";
import { getLocalStore } from "./util/localStorage";

import expect from "expect";

describe("Vocab context-aware errors", () => {
  beforeEach(() => {
    delete process.env.NODE_ENV;
  });

  it("should fail if wrapped exception is not an Error", function () {
    const context = new VocabContext("en", getLocalStore());
    expect(
      // @ts-ignore, because the parameters of the constructor
      // explicitly expect (string, Error), to which (string, string) cannot
      // be assigned.
      () => new VocabContextError(context, "test", "Not an error!")
    ).toThrowError("test");
    expect(
      // @ts-ignore
      () => new VocabContextError(context, "test", "Not an error!")
    ).toThrowError("Not an error!");
  });

  it("should be possible to create without a wrapped error", function () {
    const context = new VocabContext("en", getLocalStore());
    expect(new VocabContextError(context, "test", undefined)).not.toBeNull();
  });

  it("should be able to wrap a standard error", function () {
    const context = new VocabContext("en", getLocalStore());
    const message = "Error occurred";
    const wrapMessage = "Wrap error message";
    const wrapError = new VocabContextError(
      context,
      wrapMessage,
      new Error(message)
    );

    expect(wrapError.countLevels()).toBe(2);

    const fullReport = wrapError.unwrapException();
    expect(fullReport).toEqual(expect.stringContaining(message));
    expect(fullReport).toEqual(expect.stringContaining(wrapMessage));
  });

  it("should contain wrapped exception details", function () {
    const context = new VocabContext("en", getLocalStore());
    const errorLevel1 = new VocabContextError(
      context,
      "Error message Level1",
      undefined
    );
    const errorLevel2 = new VocabContextError(
      context,
      "Error message Level2",
      errorLevel1
    );
    const errorLevel3 = new VocabContextError(
      context,
      "Error message Level3",
      errorLevel2
    );
    expect(errorLevel3.countLevels()).toBe(3);
    const fullReport = errorLevel3.unwrapException();
    expect(fullReport).toEqual(expect.stringContaining("Error message Level1"));
    expect(fullReport).toEqual(expect.stringContaining("Error message Level2"));
    expect(fullReport).toEqual(expect.stringContaining("Error message Level3"));
  });

  it("throwing a standard error loses nested information", function () {
    const context = new VocabContext("en", getLocalStore());
    const errorLevel1 = new VocabContextError(
      context,
      "Error message Level1",
      undefined
    );
    const errorLevel2 = new Error("Standard Error message Level2");
    const errorLevel3 = new VocabContextError(
      context,
      "Error message Level3",
      errorLevel2
    );
    const errorLevel4 = new VocabContextError(
      context,
      "Error message Level4",
      errorLevel3
    );

    expect(errorLevel4.countLevels()).toBe(3);
    const fullReport = errorLevel4.unwrapException();
    expect(fullReport).not.toEqual(
      expect.stringContaining(errorLevel1.message)
    );
    expect(fullReport).toEqual(
      expect.stringContaining("Standard Error message Level2")
    );
    expect(fullReport).toEqual(expect.stringContaining("Error message Level3"));
    expect(fullReport).toEqual(expect.stringContaining("Error message Level4"));
  });

  it("should contain wrapped exception details, but no stack info", function () {
    const context = new VocabContext("en", getLocalStore());
    process.env.NODE_ENV = "production";
    const errorLevel1 = new VocabContextError(
      context,
      "Error message Level1",
      undefined
    );
    const errorLevel2 = new VocabContextError(
      context,
      "Error message Level2",
      errorLevel1
    );
    const errorLevel3 = new VocabContextError(
      context,
      "Error message Level3",
      errorLevel2
    );

    expect(errorLevel3.countLevels()).toBe(3);
    const fullReport = errorLevel3.unwrapException();
    expect(fullReport).toEqual(expect.stringContaining("Error message Level1"));
    expect(fullReport).toEqual(expect.stringContaining("Error message Level2"));
    expect(fullReport).toEqual(expect.stringContaining("Error message Level3"));

    expect(fullReport).not.toEqual(expect.stringContaining("Level "));
  });

  it("should unwrap when calling toString()", function () {
    const context = new VocabContext("en", getLocalStore());
    const message = "Error occurred";
    try {
      throw new Error(message);
    } catch (error) {
      const wrapMessage = "Wrap error message";
      const wrapError = new VocabContextError(context, wrapMessage, error);
      expect(wrapError.countLevels()).toBe(2);

      const fullReport = wrapError.toString();
      expect(fullReport).toEqual(expect.stringContaining(message));
      expect(fullReport).toEqual(expect.stringContaining(wrapMessage));
    }
  });

  it("should check if our error contains specified values", function () {
    const context = new VocabContext("en", getLocalStore());
    const message = "Error occurred";
    try {
      throw new VocabContextError(context, message, undefined);
    } catch (error) {
      expect(error.contains(["Error"])).toBe(true);
      expect(error.contains(["Error", "occurred"])).toBe(true);
      expect(error.contains(["Error", "does not", "occurred"])).toBe(false);
    }
  });

  it("should return true if we don't actually check for any arguments", function () {
    const context = new VocabContext("en", getLocalStore());
    const message = "Error occurred";
    try {
      throw new VocabContextError(context, message, undefined);
    } catch (error) {
      expect(error.contains()).toBe(true);
    }
  });

  it("should not throw on an empty stack", function () {
    const context = new VocabContext("en", getLocalStore());
    const message = "Error occurred";
    const error = new VocabContextError(context, message, undefined);
    error.stack = undefined;
    expect(error.unwrapException()).toEqual(expect.stringContaining(message));
  });

  it("should not show the whole stack in production", () => {
    if (process?.env) {
      process.env.NODE_ENV = "production";
      const context = new VocabContext("en", getLocalStore());
      const message = "Error occurred";
      const error = new VocabContextError(context, message, undefined);
      const prodReport = error.unwrapException();
      process.env.NODE_ENV = "staging";
      const stagingReport = error.unwrapException();
      expect(prodReport).not.toBe(stagingReport);
    }
  });

  it("should support non-Node environment", () => {
    const context = new VocabContext("en", getLocalStore());
    const message = "Error occurred";
    const error = new VocabContextError(context, message, undefined);
    expect(() => error.unwrapException()).not.toThrowError();
  });
});
