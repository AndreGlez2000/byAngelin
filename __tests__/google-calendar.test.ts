import { describe, it, expect, vi, beforeEach } from "vitest";

const {
  mockInsert,
  mockPatch,
  mockDelete,
  mockGenerateAuthUrl,
  mockGetToken,
  mockSetCredentials,
} = vi.hoisted(() => ({
  mockInsert: vi.fn(),
  mockPatch: vi.fn(),
  mockDelete: vi.fn(),
  mockGenerateAuthUrl: vi.fn(),
  mockGetToken: vi.fn(),
  mockSetCredentials: vi.fn(),
}));

vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(function () {
        return {
          generateAuthUrl: mockGenerateAuthUrl,
          getToken: mockGetToken,
          setCredentials: mockSetCredentials,
          credentials: {},
        };
      }),
    },
    calendar: vi.fn().mockReturnValue({
      events: {
        insert: mockInsert,
        patch: mockPatch,
        delete: mockDelete,
      },
    }),
  },
}));

vi.mock("@/lib/db", () => ({
  db: {
    user: {
      findFirst: vi.fn(),
      updateMany: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import {
  getAuthUrl,
  createCalendarEvent,
  updateCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google-calendar";

describe("getAuthUrl", () => {
  it("returns a string URL", () => {
    mockGenerateAuthUrl.mockReturnValue(
      "https://accounts.google.com/o/oauth2/auth?scope=...",
    );
    const url = getAuthUrl();
    expect(typeof url).toBe("string");
    expect(url).toContain("https://");
  });
});

describe("createCalendarEvent", () => {
  beforeEach(() => {
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: "u1",
      gcalRefreshToken: "mock-refresh-token",
    } as never);
    mockInsert.mockReset();
    mockPatch.mockReset();
    mockDelete.mockReset();
  });

  it("returns event ID when successful", async () => {
    mockInsert.mockResolvedValue({ data: { id: "gcal-event-123" } });

    const result = await createCalendarEvent({
      summary: "Limpieza Facial — Ana López",
      start: new Date("2026-04-01T10:00:00"),
      durationMin: 60,
    });

    expect(result).toBe("gcal-event-123");
  });

  it("returns null when no refresh token stored", async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue(null);

    const result = await createCalendarEvent({
      summary: "Test",
      start: new Date(),
      durationMin: 60,
    });

    expect(result).toBeNull();
  });

  it("returns null on API error — does not throw", async () => {
    mockInsert.mockRejectedValue(new Error("API error"));

    const result = await createCalendarEvent({
      summary: "Test",
      start: new Date(),
      durationMin: 60,
    });

    expect(result).toBeNull();
  });
});

describe("updateCalendarEvent", () => {
  beforeEach(() => {
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: "u1",
      gcalRefreshToken: "mock-refresh-token",
    } as never);
    mockPatch.mockReset();
  });

  it("calls events.patch with eventId", async () => {
    mockPatch.mockResolvedValue({ data: {} });

    await updateCalendarEvent({
      eventId: "gcal-event-123",
      summary: "Nueva Limpieza — Ana",
      start: new Date("2026-04-01T11:00:00"),
      durationMin: 90,
    });

    expect(mockPatch).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: "gcal-event-123" }),
    );
  });

  it("does nothing when no refresh token", async () => {
    vi.mocked(db.user.findFirst).mockResolvedValue(null);

    await updateCalendarEvent({
      eventId: "x",
      summary: "x",
      start: new Date(),
      durationMin: 60,
    });

    expect(mockPatch).not.toHaveBeenCalled();
  });

  it("does not throw on API error", async () => {
    mockPatch.mockRejectedValue(new Error("network error"));

    await expect(
      updateCalendarEvent({
        eventId: "x",
        summary: "x",
        start: new Date(),
        durationMin: 60,
      }),
    ).resolves.not.toThrow();
  });
});

describe("deleteCalendarEvent", () => {
  beforeEach(() => {
    vi.mocked(db.user.findFirst).mockResolvedValue({
      id: "u1",
      gcalRefreshToken: "mock-refresh-token",
    } as never);
    mockDelete.mockReset();
  });

  it("calls events.delete with eventId", async () => {
    mockDelete.mockResolvedValue({});

    await deleteCalendarEvent("gcal-event-123");

    expect(mockDelete).toHaveBeenCalledWith(
      expect.objectContaining({ eventId: "gcal-event-123" }),
    );
  });

  it("does not throw on API error", async () => {
    mockDelete.mockRejectedValue(new Error("not found"));

    await expect(deleteCalendarEvent("x")).resolves.not.toThrow();
  });
});
