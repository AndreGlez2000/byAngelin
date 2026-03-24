import { describe, it, expect } from "vitest";
import { parseDurationMin, findOverlap } from "../lib/appointments";

describe("parseDurationMin", () => {
  it("parses '80 min' → 80", () => {
    expect(parseDurationMin("80 min")).toBe(80);
  });
  it("parses '50 min' → 50", () => {
    expect(parseDurationMin("50 min")).toBe(50);
  });
  it("falls back to 60 for unknown format", () => {
    expect(parseDurationMin("")).toBe(60);
  });
});

// Helpers for test appointments
const mkAppt = (id: string, isoStart: string, service: string) => ({
  id,
  date: isoStart,
  service,
  status: "CONFIRMED" as const,
  sessionNotes: null,
  client: { id: "c1", name: "Test", phone: "" },
});
const mkSvc = (name: string, duration: string) => ({
  id: name,
  name,
  category: "Facial",
  duration,
  price: "$100",
});

// Base: existing appt 10:00–11:20 (80 min)
const existingAppts = [mkAppt("a1", "2026-03-24T10:00:00.000Z", "Facial A")];
const services = [mkSvc("Facial A", "80 min"), mkSvc("Facial B", "60 min")];

describe("findOverlap", () => {
  it("returns null when no conflict", () => {
    // New appt: 11:30–12:30 → no overlap with 10:00–11:20
    const newStart = new Date("2026-03-24T11:30:00.000Z");
    expect(findOverlap(newStart, 60, existingAppts, services)).toBeNull();
  });

  it("detects overlap when new appt starts during existing", () => {
    // New appt: 10:30–11:30 → overlaps with 10:00–11:20
    const newStart = new Date("2026-03-24T10:30:00.000Z");
    expect(findOverlap(newStart, 60, existingAppts, services)).toBe(existingAppts[0]);
  });

  it("detects overlap when existing starts during new appt", () => {
    // New appt: 09:30–10:30 → overlaps with 10:00–11:20
    const newStart = new Date("2026-03-24T09:30:00.000Z");
    expect(findOverlap(newStart, 60, existingAppts, services)).toBe(existingAppts[0]);
  });

  it("no overlap when new appt ends exactly when existing starts", () => {
    // New appt: 09:00–10:00 → ends at 10:00 = existing starts → no overlap
    const newStart = new Date("2026-03-24T09:00:00.000Z");
    expect(findOverlap(newStart, 60, existingAppts, services)).toBeNull();
  });

  it("excludes appointment by id (edit mode)", () => {
    // Same slot as existing, but we're editing that same appt → no conflict
    const newStart = new Date("2026-03-24T10:00:00.000Z");
    expect(findOverlap(newStart, 80, existingAppts, services, "a1")).toBeNull();
  });

  it("treats CANCELLED appointments as blocking (all statuses included — no status filtering)", () => {
    // findOverlap does NOT filter by status: all appointments passed in are checked.
    // The caller (client or API) is responsible for not pre-filtering by status.
    const cancelled = [mkAppt("a2", "2026-03-24T10:00:00.000Z", "Facial A")];
    (cancelled[0] as any).status = "CANCELLED";
    const newStart = new Date("2026-03-24T10:30:00.000Z");
    expect(findOverlap(newStart, 60, cancelled, services)).toBe(cancelled[0]);
  });
});
