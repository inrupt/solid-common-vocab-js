/** @jest-environment node */ /* eslint-disable-line */
// The @jest-environment node MUST be the first line
// of the file, which conflicts with eslint header rule.

/**
 * Begin license text.
 * Copyright <YEAR> Inrupt Inc.
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

import { buildStore, getLocalStore } from "./localStorage";

describe("Locally built store complies with localStorage interface", () => {
  it("should set and get items appropriately", () => {
    const store = buildStore();
    store.setItem("test key", "test value");
    store.setItem("another key", "another value");
    expect(store.getItem("test key")).toEqual("test value");
    expect(store.getItem("another key")).toEqual("another value");
    expect(store.getItem("non existing key")).toEqual(null);
  });

  it("should remove items", () => {
    const store = buildStore();
    store.setItem("test key", "test value");
    store.setItem("another key", "another value");
    store.removeItem("test key");
    expect(store.getItem("test key")).toEqual(null);
    expect(store.getItem("another key")).toEqual("another value");
  });

  it("should clear the storage", () => {
    const store = buildStore();
    store.setItem("test key", "test value");
    store.setItem("another key", "another value");
    store.clear();
    expect(store.getItem("test key")).toEqual(null);
    expect(store.getItem("another key")).toEqual(null);
  });

  it("should report the size of the storage", () => {
    const store = buildStore();
    expect(store.length).toEqual(0);
    store.setItem("test key", "test value");
    expect(store.length).toEqual(1);
    store.setItem("another key", "another value");
    expect(store.length).toEqual(2);
    store.clear();
    expect(store.length).toEqual(0);
  });

  it("should enable iterating though keys", () => {
    const store = buildStore();
    expect(store.key(0)).toBe(null);
    store.setItem("test key", "test value");
    expect(store.key(0)).toEqual("test key");
    store.setItem("another key", "another value");
    expect(store.key(0)).toEqual("test key");
    expect(store.key(1)).toEqual("another key");
  });
});

describe("localstorage should work in a Node environment", () => {
  it("should return a proper store instance", () => {
    const store = getLocalStore();
    store.setItem("test key", "test value");
    expect(store.getItem("test key")).toEqual("test value");
  });
});
