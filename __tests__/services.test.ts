import { describe, it, expect } from "vitest";
import { SERVICES, getServiceById, getServiceNames } from "../lib/services";

describe("SERVICES catalog", () => {
  it("has 8 services", () => {
    expect(SERVICES).toHaveLength(8);
  });

  it("all services have required fields", () => {
    for (const s of SERVICES) {
      expect(s.id).toBeTruthy();
      expect(s.name).toBeTruthy();
      expect(s.durationMin).toBeGreaterThan(0);
      expect(s.price).toBeGreaterThan(0);
    }
  });

  it("getServiceById returns correct service", () => {
    const s = getServiceById("foterapia");
    expect(s?.name).toBe("Fototerapia Facial");
    expect(s?.durationMin).toBe(45);
  });

  it("getServiceById returns undefined for unknown id", () => {
    expect(getServiceById("no-existe")).toBeUndefined();
  });

  it("getServiceNames returns all names", () => {
    const names = getServiceNames();
    expect(names).toHaveLength(8);
    expect(names).toContain("Fototerapia Facial");
  });
});
