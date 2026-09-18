import { describe, it, expect } from "vitest";
import capabilities from "../capabilities.json";

// Et erklæret privilegium, ingen kode bruger, er en tilladelse, brugeren
// bliver bedt om uden grund. Listen holdes tom, indtil noget faktisk kalder
// det tilsvarende API.

describe("Privilegier", () => {
  it("beder ikke om nogen", () => {
    expect((capabilities as any).privileges).toEqual([]);
  });
});
