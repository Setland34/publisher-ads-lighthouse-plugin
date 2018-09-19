const AdRequestFromTagLoad = require('../../audits/ad-request-from-tag-load');
const chai = require('chai');
const NetworkRecorder = require('lighthouse/lighthouse-core/lib/network-recorder');
const expect = chai.expect;
const sinon = require('sinon');

const AD_REQUEST_URL = 'https://securepubads.g.doubleclick.net/gampad/ads?foo';
const TAG_URL = 'https://securepubads.g.doubleclick.net/gpt/pubads_impl_243.js';

/**
 * @param {Array<{url: string}>} requests
 * @return {Object} An object partly following the HAR spec.
 */
function newHar(requests) {
  const wrappedRequests = requests.map((req) => ({request: req}));
  return {log: {entries: wrappedRequests}};
}

describe('AdRequestFromTagLoad', async () => {
  let sandbox;

  beforeEach(() => {
    sandbox = sinon.createSandbox();
  });

  afterEach(() => {
    sandbox.restore();
  });

  describe('adRequestFromTagLoadTest', async () => {
    const testCases = [
      {
        desc: 'should pass for records containing successful page and tag load',
        networkRecords: [
          {url: TAG_URL, endTime: .25},
          {url: AD_REQUEST_URL, startTime: .5},
        ],
        expectedTime: 250,
      },
      {
        desc: 'should not be applicable if tag is never loaded',
        networkRecords: [
          {url: AD_REQUEST_URL, startTime: .5},
        ],
        expectedNotAppl: true,
      },
      {
        desc: 'should not be applicable if ad is never requested',
        networkRecords: [
          {url: TAG_URL, startTime: .5},
        ],
        expectedNotAppl: true,
      },

    ];
    for (const {desc, networkRecords, expectedTime, expectedNotAppl}
      of testCases) {
      it(`${desc} with a load time of ${expectedTime}`, async () => {
        sandbox.stub(NetworkRecorder, 'recordsFromLogs')
            .returns(networkRecords);
        const artifacts =
              {Network: {har: newHar(networkRecords), networkRecords}};

        const results = await AdRequestFromTagLoad.audit(artifacts);
        if (expectedNotAppl) {
          expect(results).to.have.property('notApplicable', true);
        } else {
          expect(results).to.have.property('rawValue', expectedTime);
        }
      });
    }
  });
});