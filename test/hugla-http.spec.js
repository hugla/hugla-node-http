const HuglaHttp = require('../lib/hugla-http').default;

test('it built successfully', () => {
  expect(HuglaHttp).toBeInstanceOf(Object);
});
