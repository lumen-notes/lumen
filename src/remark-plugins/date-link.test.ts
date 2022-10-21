import { micromark } from "micromark"
import { expect, test } from "vitest"
import { dateLink, dateLinkHtml } from "./date-link"

function runTests(tests: Array<{ input: string; output: string }>) {
  for (const { input, output } of tests) {
    test(input, () => {
      const html = micromark(input, {
        extensions: [dateLink()],
        htmlExtensions: [dateLinkHtml()],
      })
      expect(html).toBe(output)
    })
  }
}

runTests([
  // Valid dates
  {
    input: `[[1998-7-11]]`,
    output: `<p>[[1998-7-11]]</p>`,
  },
  {
    input: `[[1998-07-11]]`,
    output: `<p><date-link date="1998-07-11" /></p>`,
  },
  {
    input: `[[1998-07-01]]`,
    output: `<p><date-link date="1998-07-01" /></p>`,
  },
  {
    input: `[[2022-07-11]]`, // current year
    output: `<p><date-link date="2022-07-11" /></p>`,
  },
  {
    input: `[[[1998-07-11]]]`,
    output: `<p>[<date-link date="1998-07-11" />]</p>`,
  },
  {
    input: `_[[1998-07-11]]_`,
    output: `<p><em><date-link date="1998-07-11" /></em></p>`,
  },

  // Invalid dates
  {
    input: `[[1998-007-11]]`,
    output: `<p>[[1998-007-11]]</p>`,
  },
  {
    input: `[[1998-07-1]]`,
    output: `<p>[[1998-07-1]]</p>`,
  },
  {
    input: `[[1998-07-001]]`,
    output: `<p>[[1998-07-001]]</p>`,
  },
  {
    input: `[[98-07-01]]`,
    output: `<p>[[98-07-01]]</p>`,
  },
  {
    input: `[[020-07-01]]`,
    output: `<p>[[020-07-01]]</p>`,
  },
  {
    input: `[[02020-07-01]]`,
    output: `<p>[[02020-07-01]]</p>`,
  },
  // {
  //   input: `[[1998-07-32]]`, // invalid day
  //   output: `<p>[[1998-07-32]]</p>`,
  // },
  // {
  //   input: `[[1998-13-11]]`, // invalid month
  //   output: `<p>[[1998-13-11]]</p>`,
  // },
  {
    input: `[[199x-07-11]]`,
    output: `<p>[[199x-07-11]]</p>`,
  },
])
