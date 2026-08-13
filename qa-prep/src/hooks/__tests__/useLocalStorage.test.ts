import { act, renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";
import { useIdSet, useLocalStorage } from "../useLocalStorage";

beforeEach(() => window.localStorage.clear());

describe("useLocalStorage", () => {
  it("falls back to the initial value when nothing is stored", () => {
    const { result } = renderHook(() => useLocalStorage("k", "fallback"));
    expect(result.current[0]).toBe("fallback");
  });

  it("reads a previously stored value", () => {
    window.localStorage.setItem("k", JSON.stringify("stored"));
    const { result } = renderHook(() => useLocalStorage("k", "fallback"));
    expect(result.current[0]).toBe("stored");
  });

  it("falls back rather than throwing on corrupt JSON", () => {
    window.localStorage.setItem("k", "{not json");
    const { result } = renderHook(() => useLocalStorage("k", "fallback"));
    expect(result.current[0]).toBe("fallback");
  });

  it("persists what it is given", () => {
    const { result } = renderHook(() => useLocalStorage("k", 0));
    act(() => result.current[1](42));
    expect(JSON.parse(window.localStorage.getItem("k")!)).toBe(42);
  });
});

describe("useIdSet", () => {
  it("toggles an id on and off", () => {
    const { result } = renderHook(() => useIdSet("ids"));
    act(() => result.current.toggle("a"));
    expect(result.current.set.has("a")).toBe(true);
    expect(result.current.size).toBe(1);

    act(() => result.current.toggle("a"));
    expect(result.current.set.has("a")).toBe(false);
    expect(result.current.size).toBe(0);
  });

  it("clears every id", () => {
    const { result } = renderHook(() => useIdSet("ids"));
    act(() => {
      result.current.toggle("a");
      result.current.toggle("b");
    });
    act(() => result.current.clear());
    expect(result.current.size).toBe(0);
  });

  /* Callers put this Set in useMemo dependency lists. If it were rebuilt on
     every render their memoisation would silently never hold. */
  it("keeps the same Set identity across renders that change nothing", () => {
    const { result, rerender } = renderHook(() => useIdSet("ids"));
    const first = result.current.set;
    rerender();
    expect(result.current.set).toBe(first);
  });

  it("returns a new Set identity once the ids actually change", () => {
    const { result } = renderHook(() => useIdSet("ids"));
    const first = result.current.set;
    act(() => result.current.toggle("a"));
    expect(result.current.set).not.toBe(first);
  });
});
