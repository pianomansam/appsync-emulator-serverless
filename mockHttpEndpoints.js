const nock = require('nock');
const fs = require('fs');
const path = require('path');

const mockHttpEndpoints = ({
  httpMocks,
  serverlessDirectory: cwd,
  dataSources,
}) => {
  if (!httpMocks || !httpMocks.length) {
    return;
  }

  const reply = ({ response, path: responsePath }, uri, requestBody) => {
    if (response.code && response.data) {
      return [response.code, response.data];
    }

    if (response.code && response.file) {
      const data = fs
        .readFileSync(path.join(cwd, response.file), 'utf8')
        .toString();
      return [response.code, data];
    }

    if (response.function) {
      // eslint-disable-next-line import/no-dynamic-require
      const fn = require(path.join(cwd, response.function));
      return fn(uri, requestBody);
    }

    throw new Error(`Invalid http mock: No response for path ${responsePath}`);
  };

  httpMocks.forEach(mock => {
    const dataSource = dataSources.filter(d => d.name === mock.dataSource)[0];

    if (mock.function) {
      // eslint-disable-next-line import/no-dynamic-require
      const fn = require(path.join(cwd, mock.function));
      fn({ nock, mock, dataSource });
    } else {
      nock(dataSource.config.endpoint)
        .persist()
        [mock.method](mock.path)
        .reply((uri, requestBody) => reply(mock, uri, requestBody));
    }
  });
};

module.exports = mockHttpEndpoints;
