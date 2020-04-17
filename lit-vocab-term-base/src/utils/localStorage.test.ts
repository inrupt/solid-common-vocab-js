/**
 * @jest-environment node
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
