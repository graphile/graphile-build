/*
 * This file is critical to how the integration tests work. It was back-ported
 * from V5 so that we could transform the V4 tests into a V5-compatible format,
 * so that we could then forward-port the V4 test suite again... Fun.
 *
 * We create `.test.graphql` GraphQL documents and these are then "transformed"
 * into standard Jest tests (see below). At the top of these .test.graphql files
 * a number of checks/configurations can be specified:
 *
 * - Lines starting `##` are where our assertions are added; these are useful to
 *   ensure that anything that wants a concrete assertion (i.e. not a snapshot
 *   that can be overwritten) can be checked.
 * - Lines starting `#>` are configurations, we expect `<key>: <value>` where
 *   `key` is a plain string and value is a JSON5 value
 *   - `directPg`: use a direct connection to PG rather than our helper which tracks queries
 *   - `checkErrorSnapshots`: if set `false` then we'll not test the errors
 * - Lines starting `#!` are to be added to the "callback", this is typically
 *   useful for subscription tests that need to trigger events, etc
 */

// IMPORTANT: after editing this file, you must run `yarn jest --clearCache`
// because the transformed code gets cached.

const JSON5 = require("json5");

exports.process = (src, path) => {
  const lines = src.split("\n");
  const config = Object.create(null);
  config.checkErrorSnapshots = true;
  const assertions = [];
  const documentLines = [];
  const scripts = [];
  for (const line of lines) {
    if (line.startsWith("#>")) {
      const colon = line.indexOf(":");
      if (colon < 0) {
        throw new Error(
          `Invalid query configuration '${line}' - expected colon.`
        );
      }
      const key = line.substr(2, colon - 2).trim();
      const value = JSON5.parse(line.substr(colon + 1));
      config[key] = value;
    } else if (line.startsWith("##")) {
      const assertion = line.substr(2);
      assertions.push(assertion);
      if (/expect\(errors\).toBeFalsy\(\)/.test(assertion)) {
        config.checkErrorSnapshots = false;
      }
    } else if (line.startsWith("#!")) {
      scripts.push(line.substr(2));
    } else if (line.match(/^#\s*expect\(/)) {
      throw new Error(
        "Found line that looks like an assertion, but isn't in a '##' comment: '${line}'"
      );
    } else {
      documentLines.push(line);
    }
  }
  const document = documentLines.join("\n");

  // NOTE: technically JSON.stringify is not safe for producing JavaScript
  // code, this could be a security vulnerability in general. However, in this
  // case all the data that we're converting to code is controlled by us, so
  // we'd only be attacking ourselves, therefore we'll allow it rather than
  // bringing in an extra dependency.
  return `\
const { assertSnapshotsMatch, runTestQuery } = require("../_test");

const document = ${JSON.stringify(document)};
const path = ${JSON.stringify(path)};
const config = ${JSON.stringify(config)};

let result;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

const waitFor = async (conditionCallback, max = 1000) => {
  let start = Date.now();
  while (!conditionCallback()) {
    if (Date.now() >= start + max) {
      throw new Error(\`Waited \${max}ms but condition does not pass\`);
    }
    await sleep(10);
  }
}

const callback = ${
    scripts.length
      ? `async (pgClient, payloads) => {
  ${scripts.join("\n  ")}
}`
      : `null`
  };

beforeAll(() => {
  result = runTestQuery(document, config, { callback, path });
  // Wait for these promises to resolve, even if it's with errors.
  return Promise.all([result.catch(e => {})]);
}, 30000);

afterAll(() => {
  result = null;
});

${assertions
  .map(assertion => {
    return `\
it(${JSON.stringify(assertion.trim())}, async () => {
  const resultValue = await result;
  if (!resultValue) {
    console.log("Test skipped");
    return;
  }
  const { data, payloads, errors, queries } = resultValue;
  ${assertion}
});`;
  })
  .join("\n\n")}

it('matches SQL snapshots', () => assertSnapshotsMatch('sql', {
  document,
  path,
  config,
  result,
}));

it('matches data snapshot', () => assertSnapshotsMatch('result', {
  document,
  path,
  config,
  result,
}));

if (config.checkErrorSnapshots) {
  it('matches errors snapshot', () => assertSnapshotsMatch('errors', {
    document,
    path,
    config,
    result,
  }));
}

`;
};
