const {test} = require('tap');

const {getInfoResponse} = require('./../fixtures');
const {getSwapCost} = require('./../../swaps');

const makeLnd = ({}) => {
  return {
    default: {
      getInfo: ({}, cbk) => cbk(null, getInfoResponse),
    },
  };
};

const makeQuote = ({}) => ({
  cltv_delta: 10,
  prepay_amt: 1,
  swap_fee: 2,
  swap_payment_dest: Buffer.alloc(33).toString('hex'),
});

const makeService = ({}) => {
  return {
    loopOutQuote: ({}, {}, cbk) => cbk(null, makeQuote({})),
    loopOutTerms: ({}, {}, cbk) => cbk(null, makeTerms({max: 1e7})),
  };
};

const makeTerms = ({max, min}) => ({
  max_cltv_delta: 20,
  max_swap_amount: max || 1,
  min_cltv_delta: 10,
  min_swap_amount: min || 1,
});

const tests = [
  {
    args: {lnd: {}, logger: {}},
    description: 'Swap service is required',
    error: [400, 'ExpectedSwapServiceToGetSwapCost'],
  },
  {
    args: {lnd: {}, logger: {}, service: {}},
    description: 'Tokens are required',
    error: [400, 'ExpectedTokensCountToGetSwapCost'],
  },
  {
    args: {lnd: {}, logger: {}, service: {}, tokens: 1},
    description: 'Swap type is required',
    error: [400, 'ExpectedLiquidityTypeToGetSwapCost'],
  },
  {
    args: {
      lnd: {},
      logger: {},
      service: makeService({}),
      tokens: 1,
      type: 'type',
    },
    description: 'Known swap type is required',
    error: [400, 'GotUnexpectedSwapTypeWhenGettingSwapCost'],
  },
  {
    args: {
      lnd: makeLnd({}),
      logger: {},
      service: {
        loopOutQuote: ({}, {}, cbk) => cbk(null, makeQuote({})),
        loopOutTerms: ({}, {}, cbk) => cbk(null, makeTerms({})),
      },
      tokens: 1e6,
      type: 'inbound',
    },
    description: 'Amount must be under maximum',
    error: [400, 'AmountExceedsMaximum', {max: 1}],
  },
  {
    args: {
      lnd: makeLnd({}),
      logger: {},
      service: {
        loopInQuote: ({}, {}, cbk) => cbk(null, makeQuote({})),
        loopInTerms: ({}, {}, cbk) => {
          return cbk(null, makeTerms({max: 1e7, min: 1e6}));
        },
      },
      tokens: 1e5,
      type: 'outbound',
    },
    description: 'Amount must be over minimum',
    error: [400, 'AmountBelowMinimumSwap', {min: 1e6}],
  },
  {
    args: {
      lnd: makeLnd({}),
      logger: {},
      service: makeService({}),
      tokens: 1e6,
      type: 'inbound',
    },
    description: 'Amount must be under maximum',
    expected: {cost: 2},
  },
];

tests.forEach(({args, description, error, expected}) => {
  return test(description, async ({end, equal, rejects}) => {
    if (!!error) {
      await rejects(getSwapCost(args), error, 'Got expected error');
    } else {
      equal((await getSwapCost(args)).cost, expected.cost, 'Got cost');
    }

    return end();
  });
});
