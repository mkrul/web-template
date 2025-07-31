const {
  getSdk,
  getTrustedSdk,
  handleError,
  fetchUtils,
} = require('../../server-util');

const senpexRequest = (method, path, options = {}) => {
  const { headers = {}, body, ...otherOptions } = options;

  return fetchUtils.fetchRequest({
    method,
    url: `${process.env.SENPEX_API_BASE_URL}${path}`,
    headers: {
      clientid: process.env.SENPEX_CLIENT_ID,
      secretid: process.env.SENPEX_SECRET_ID,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...otherOptions,
  });
};

module.exports = (router) => {
  router.post('/shipping/senpex/quote', async (req, res) => {
    const { body } = req;

    try {
      const response = await senpexRequest('POST', '/orders/pickup/quote', {
        body,
      });
      res.status(200).json(response);
    } catch (error) {
      console.error('Senpex quote error:', error);
      handleError(res, error);
    }
  });

  router.put('/shipping/senpex/confirm', async (req, res) => {
    const { body } = req;

    try {
      const response = await senpexRequest('PUT', '/orders/pickup', { body });
      res.status(200).json(response);
    } catch (error) {
      console.error('Senpex confirm error:', error);
      handleError(res, error);
    }
  });

  router.post('/shipping/senpex/dropoff/quote', async (req, res) => {
    const { body } = req;

    try {
      const response = await senpexRequest('POST', '/orders/dropoff/quote', {
        body,
      });
      res.status(200).json(response);
    } catch (error) {
      console.error('Senpex dropoff quote error:', error);
      handleError(res, error);
    }
  });

  router.put('/shipping/senpex/dropoff/confirm', async (req, res) => {
    const { body } = req;

    try {
      const response = await senpexRequest('PUT', '/orders/dropoff', { body });
      res.status(200).json(response);
    } catch (error) {
      console.error('Senpex dropoff confirm error:', error);
      handleError(res, error);
    }
  });
};
