import { expect, test } from "vitest"
import {
  formatDate,
  formatDateDistance,
  getNextBirthday,
  isValidDateString,
  isValidUnixTimestamp,
  toDateString,
  toDateStringUtc,
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

describe("formatDate", () => {
  test("formats a date string", () => {
    expect(formatDate("2021-07-11")).toBe("Sun, Jul 11")
    expect(formatDate("1998-07-11")).toBe("Sat, Jul 11 1998")
  })

  test("excludes the day of week if option is set", () => {
    expect(formatDate("2021-07-11", { excludeDayOfWeek: true })).toBe("Jul 11")
    expect(formatDate("1998-07-11", { excludeDayOfWeek: true })).toBe("Jul 11 1998")
  })

  test("throws an error if the date string is invalid", () => {
    expect(() => formatDate("")).toThrow()
    expect(() => formatDate("2021-07")).toThrow()
    expect(() => formatDate("hello")).toThrow()
  })
})

describe("formatDateDistance", () => {
  test("formats a date string relative to today", () => {
    expect(formatDateDistance("2021-07-11")).toBe("Today")
    expect(formatDateDistance("2021-07-12")).toBe("Tomorrow")
    expect(formatDateDistance("2021-07-10")).toBe("Yesterday")
    expect(formatDateDistance("2021-07-13")).toBe("in 2 days")
    expect(formatDateDistance("2021-07-09")).toBe("2 days ago")
    expect(formatDateDistance("2021-07-18")).toBe("in 1 week")
    expect(formatDateDistance("2021-07-04")).toBe("1 week ago")
    expect(formatDateDistance("2021-08-11")).toBe("in 1 month")
    expect(formatDateDistance("2021-06-11")).toBe("1 month ago")
    expect(formatDateDistance("2022-07-11")).toBe("in 1 year")
    expect(formatDateDistance("2020-07-11")).toBe("1 year ago")
  })

  test("throws an error if the date string is invalid", () => {
    expect(() => formatDateDistance("")).toThrow()
    expect(() => formatDateDistance("2021-07")).toThrow()
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

describe("toDateStringUtc", () => {
  test("converts a date to a string in the format YYYY-MM-DD using UTC", () => {
    expect(toDateStringUtc(new Date(Date.UTC(2021, 6, 11)))).toBe("2021-07-11")
    expect(toDateStringUtc(new Date(Date.UTC(1998, 6, 11)))).toBe("1998-07-11")
    expect(toDateStringUtc(new Date(Date.UTC(0, 0, 1)))).toBe("1900-01-01")
  })
})

describe("getNextBirthday", () => {
  test("returns the next birthday for a given date", () => {
    expect(getNextBirthday(new Date(1998, 6, 11))).toEqual(new Date(2021, 6, 11))
    expect(getNextBirthday(new Date(1998, 6, 12))).toEqual(new Date(2021, 6, 12))
    expect(getNextBirthday(new Date(1998, 6, 10))).toEqual(new Date(2022, 6, 10))
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
