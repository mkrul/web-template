const { handleError } = require('../api-util/sdk');
const {
  buildSenpexQuoteRequest,
  parseSenpexQuoteResponse,
} = require('../api-util/senpexHelpers');

const senpexRequest = async (method, path, options = {}) => {
  const { headers = {}, body, ...otherOptions } = options;
  const url = `${process.env.SENPEX_API_BASE_URL}${path}`;
  try {
    // High-signal outbound request logging (masking phone)
    const safeBody = body
      ? {
          ...body,
          routes: Array.isArray(body.routes)
            ? body.routes.map((r) => ({
                ...r,
                rec_phone: r.rec_phone ? '***masked***' : r.rec_phone,
              }))
            : body.routes,
        }
      : undefined;
    // eslint-disable-next-line no-console
    console.log('[Senpex] Request', { method, url, body: safeBody });
  } catch (_) {}
  const res = await globalThis.fetch(url, {
    method,
    headers: {
      clientid: process.env.SENPEX_CLIENT_ID,
      secretid: process.env.SENPEX_SECRET_ID,
      'Content-Type': 'application/json',
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    ...otherOptions,
  });
  if (!res.ok) {
    const text = await res.text();
    // eslint-disable-next-line no-console
    console.error('[Senpex] Response error', {
      status: res.status,
      statusText: res.statusText,
      body: text,
    });
    const err = new Error(`Senpex request failed: ${res.status}`);
    err.status = res.status;
    err.statusText = res.statusText;
    err.data = { body: text };
    throw err;
  }
  try {
    // eslint-disable-next-line no-console
    console.log('[Senpex] Response ok', {
      status: res.status,
      statusText: res.statusText,
    });
  } catch (_) {}
  return res.json();
};

module.exports = (router) => {
  router.post('/shipping/senpex/quote', async (req, res) => {
    const { body } = req;

    try {
      const apiBody = buildSenpexQuoteRequest({
        orderName:
          body.orderName ||
          `Order for listing ${body?.listingId?.uuid || body?.listingId || ''}`,
        isUrgent: true,
        scheduleDate: null,
        itemValue: body.itemValue || 100,
        weightLbs: body.weightLbs || 10,
        orderDescription: body.deliveryInstructions || '',
        routes: [
          {
            address: body.deliveryAddress,
            receiverName: body.receiverName,
            receiverPhone: body.receiverPhone,
            description: body.deliveryInstructions || '',
          },
        ],
      });
      const response = await senpexRequest('POST', '/orders/pickup/quote', {
        body: apiBody,
      });
      const normalized = parseSenpexQuoteResponse(response);
      res.status(200).json(normalized);
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
      const apiBody = buildSenpexQuoteRequest({
        orderName:
          body.orderName ||
          `Order for listing ${body?.listingId?.uuid || body?.listingId || ''}`,
        isUrgent: true,
        scheduleDate: null,
        itemValue: body.itemValue || 100,
        weightLbs: body.weightLbs || 10,
        orderDescription: body.deliveryInstructions || '',
        routes: [
          {
            address: body.deliveryAddress,
            receiverName: body.receiverName,
            receiverPhone: body.receiverPhone,
            description: body.deliveryInstructions || '',
          },
        ],
      });
      const response = await senpexRequest('POST', '/orders/dropoff/quote', {
        body: apiBody,
      });
      const normalized = parseSenpexQuoteResponse(response);
      res.status(200).json(normalized);
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
