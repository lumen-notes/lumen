import { addDays } from "date-fns"
import { describe, expect, test } from "vitest"
import {
  formatDate,
  formatDateDistance,
  getNextBirthday,
  isValidDateString,
  isValidUnixTimestamp,
  isValidWeekString,
  toDateString,
} from "./date"

describe("isValidDateString", () => {
  test("returns true for valid date strings", () => {
    expect(isValidDateString("2021-07-11")).toBe(true)
    expect(isValidDateString("1998-07-11")).toBe(true)
    expect(isValidDateString("0000-01-01")).toBe(true)
  })

  test("returns false for invalid date strings", () => {
    expect(isValidDateString("")).toBe(false)
    expect(isValidDateString("2021-07")).toBe(false)
    expect(isValidDateString("2021-07-32")).toBe(false)
    expect(isValidDateString("2021-13-11")).toBe(false)
    expect(isValidDateString("2021-07-11T12:00:00")).toBe(false)
    expect(isValidDateString("hello")).toBe(false)
  })
})

describe("isValidWeekString", () => {
  test("returns true for valid week strings", () => {
    expect(isValidWeekString("2021-W01")).toBe(true)
    expect(isValidWeekString("2021-W53")).toBe(true)
  })

  test("returns false for invalid week strings", () => {
    expect(isValidWeekString("")).toBe(false)
    expect(isValidWeekString("2021-W00")).toBe(false)
    expect(isValidWeekString("2021-W54")).toBe(false)
    expect(isValidWeekString("2021-07-11")).toBe(false)
    expect(isValidWeekString("hello")).toBe(false)
  })
})

describe("formatDate", () => {
  test("formats a date string", () => {
    const currentYear = new Date().getUTCFullYear()
    expect(formatDate(`${currentYear}-07-11`)).toBe("Thu, Jul 11")
    expect(formatDate("1998-07-11")).toBe("Sat, Jul 11, 1998")
  })

  test("excludes the day of week if option is set", () => {
    expect(formatDate("1998-07-11", { excludeDayOfWeek: true })).toBe("Jul 11, 1998")
  })

  test("throws an error if the date string is invalid", () => {
    expect(() => formatDate("")).toThrow()
    expect(() => formatDate("hello")).toThrow()
  })
})

describe("formatDateDistance", () => {
  test("formats a date string relative to today", () => {
    const today = new Date()
    expect(formatDateDistance(toDateString(today))).toBe("Today")

    const tomorrow = addDays(today, 1)
    expect(formatDateDistance(toDateString(tomorrow))).toBe("Tomorrow")

    const yesterday = addDays(today, -1)
    expect(formatDateDistance(toDateString(yesterday))).toBe("Yesterday")
  })

  test("throws an error if the date string is invalid", () => {
    expect(() => formatDateDistance("")).toThrow()
    expect(() => formatDateDistance("hello")).toThrow()
  })
})

describe("toDateString", () => {
  test("converts a date to a string in the format YYYY-MM-DD", () => {
    expect(toDateString(new Date(2021, 6, 11))).toBe("2021-07-11")
    expect(toDateString(new Date(1998, 6, 11))).toBe("1998-07-11")
    expect(toDateString(new Date(0, 0, 1))).toBe("1900-01-01")
  })
})

describe("getNextBirthday", () => {
  test("returns the next birthday for a given date", () => {
    const today = new Date()
    expect(getNextBirthday(new Date(1998, 6, 11))).greaterThan(today)
  })
})

describe("isValidUnixTimestamp", () => {
  test("returns true for valid unix timestamps", () => {
    expect(isValidUnixTimestamp("0")).toBe(true)
    expect(isValidUnixTimestamp("1626000000000")).toBe(true)
    expect(isValidUnixTimestamp("1626000000000000")).toBe(true)
  })

  test("returns false for invalid unix timestamps", () => {
    expect(isValidUnixTimestamp("")).toBe(false)
    expect(isValidUnixTimestamp("-1")).toBe(false)
    expect(isValidUnixTimestamp("hello")).toBe(false)
    expect(isValidUnixTimestamp("1626000000000.5")).toBe(false)
  })
})
