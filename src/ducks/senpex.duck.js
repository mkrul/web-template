import { storableError } from '../util/errors';
import * as api from '../util/api';

// ================ Action types ================ //

export const SENPEX_QUOTE_REQUEST = 'app/senpex/SENPEX_QUOTE_REQUEST';
export const SENPEX_QUOTE_SUCCESS = 'app/senpex/SENPEX_QUOTE_SUCCESS';
export const SENPEX_QUOTE_ERROR = 'app/senpex/SENPEX_QUOTE_ERROR';

export const SENPEX_CONFIRM_REQUEST = 'app/senpex/SENPEX_CONFIRM_REQUEST';
export const SENPEX_CONFIRM_SUCCESS = 'app/senpex/SENPEX_CONFIRM_SUCCESS';
export const SENPEX_CONFIRM_ERROR = 'app/senpex/SENPEX_CONFIRM_ERROR';

export const SENPEX_CLEAR_QUOTE = 'app/senpex/SENPEX_CLEAR_QUOTE';

export const SENPEX_LOG_ORDER_CREATION = 'app/senpex/SENPEX_LOG_ORDER_CREATION';
export const SENPEX_CREATE_ORDER_REQUEST =
  'app/senpex/SENPEX_CREATE_ORDER_REQUEST';
export const SENPEX_CREATE_ORDER_SUCCESS =
  'app/senpex/SENPEX_CREATE_ORDER_SUCCESS';
export const SENPEX_CREATE_ORDER_ERROR = 'app/senpex/SENPEX_CREATE_ORDER_ERROR';

// ================ Reducer ================ //

const initialState = {
  quoteInProgress: false,
  quoteError: null,
  currentQuote: null,
  confirmInProgress: false,
  confirmError: null,
  createOrderInProgress: false,
  createOrderError: null,
  lastCreatedOrder: null,
};

export default function senpexReducer(state = initialState, action = {}) {
  const { type, payload } = action;

  switch (type) {
    case SENPEX_QUOTE_REQUEST:
      return {
        ...state,
        quoteInProgress: true,
        quoteError: null,
      };

    case SENPEX_QUOTE_SUCCESS:
      return {
        ...state,
        quoteInProgress: false,
        currentQuote: payload,
      };

    case SENPEX_QUOTE_ERROR:
      return {
        ...state,
        quoteInProgress: false,
        quoteError: payload,
      };

    case SENPEX_CONFIRM_REQUEST:
      return {
        ...state,
        confirmInProgress: true,
        confirmError: null,
      };

    case SENPEX_CONFIRM_SUCCESS:
      return {
        ...state,
        confirmInProgress: false,
      };

    case SENPEX_CONFIRM_ERROR:
      return {
        ...state,
        confirmInProgress: false,
        confirmError: payload,
      };

    case SENPEX_CLEAR_QUOTE:
      return {
        ...state,
        currentQuote: null,
        quoteError: null,
        confirmError: null,
      };

    case SENPEX_LOG_ORDER_CREATION:
      return state;

    case SENPEX_CREATE_ORDER_REQUEST:
      return {
        ...state,
        createOrderInProgress: true,
        createOrderError: null,
      };

    case SENPEX_CREATE_ORDER_SUCCESS:
      return {
        ...state,
        createOrderInProgress: false,
        lastCreatedOrder: payload,
      };

    case SENPEX_CREATE_ORDER_ERROR:
      return {
        ...state,
        createOrderInProgress: false,
        createOrderError: payload,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const senpexQuoteRequest = () => ({ type: SENPEX_QUOTE_REQUEST });
export const senpexQuoteSuccess = (quote) => ({
  type: SENPEX_QUOTE_SUCCESS,
  payload: quote,
});
export const senpexQuoteError = (error) => ({
  type: SENPEX_QUOTE_ERROR,
  payload: error,
  error: true,
});

export const senpexConfirmRequest = () => ({ type: SENPEX_CONFIRM_REQUEST });
export const senpexConfirmSuccess = () => ({ type: SENPEX_CONFIRM_SUCCESS });
export const senpexConfirmError = (error) => ({
  type: SENPEX_CONFIRM_ERROR,
  payload: error,
  error: true,
});

export const senpexClearQuote = () => ({ type: SENPEX_CLEAR_QUOTE });

export const logSenpexOrderCreation = (transactionData) => ({
  type: SENPEX_LOG_ORDER_CREATION,
  payload: transactionData,
});

export const senpexCreateOrderRequest = () => ({
  type: SENPEX_CREATE_ORDER_REQUEST,
});
export const senpexCreateOrderSuccess = (orderData) => ({
  type: SENPEX_CREATE_ORDER_SUCCESS,
  payload: orderData,
});
export const senpexCreateOrderError = (error) => ({
  type: SENPEX_CREATE_ORDER_ERROR,
  payload: error,
  error: true,
});

// ================ Thunks ================ //

export const getSenpexQuote = (quoteData) => (dispatch) => {
  dispatch(senpexQuoteRequest());

  const { type = 'pickup', ...rest } = quoteData || {};
  const requester =
    type === 'dropoff' ? api.senpexDropoffQuote : api.senpexPickupQuote;
  return requester(rest)
    .then((response) => {
      dispatch(senpexQuoteSuccess(response));
      return response;
    })
    .catch((error) => {
      dispatch(senpexQuoteError(storableError(error)));
      throw error;
    });
};

export const confirmSenpexOrder = (orderData) => (dispatch) => {
  dispatch(senpexConfirmRequest());
  const { type = 'pickup', ...rest } = orderData || {};
  const path =
    type === 'dropoff'
      ? '/api/shipping/senpex/dropoff/confirm'
      : '/api/shipping/senpex/confirm';
  return api
    .request(path, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: rest,
    })
    .then((response) => {
      dispatch(senpexConfirmSuccess());
      return response;
    })
    .catch((error) => {
      dispatch(senpexConfirmError(storableError(error)));
      throw error;
    });
};

/**
 * Creates an actual Senpex delivery order when a provider accepts a booking.
 * Uses the api_token from the Senpex quote stored in transaction protected data.
 *
 * @param {Object} transaction - The transaction object from the booking acceptance
 * @returns {Promise} - Promise that resolves with Senpex order creation response
 */
export const createSenpexOrderForBooking = (transaction) => (dispatch) => {
  dispatch(senpexCreateOrderRequest());

  console.log('Creating Senpex order for booking transaction:', {
    transactionId: transaction?.id?.uuid,
    processName: transaction?.attributes?.processName,
    lastTransition: transaction?.attributes?.lastTransition,
    timestamp: new Date().toISOString(),
  });

  // Call server endpoint to create actual Senpex order
  return api
    .request('/api/shipping/senpex/create-order-from-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: { transaction },
    })
    .then((response) => {
      console.log('Senpex order creation successful:', response);
      dispatch(senpexCreateOrderSuccess(response.data));
      return response;
    })
    .catch((error) => {
      console.error('Senpex order creation failed:', error);
      dispatch(senpexCreateOrderError(storableError(error)));
      throw error;
    });
};

// Keep the original logging function for backward compatibility
export const logSenpexOrderCreationForBooking = (transaction) => (dispatch) => {
  console.log('Senpex order creation logging for booking transaction:', {
    transactionId: transaction?.id?.uuid,
    processName: transaction?.attributes?.processName,
    lastTransition: transaction?.attributes?.lastTransition,
    customer: transaction?.customer?.attributes,
    provider: transaction?.provider?.attributes,
    listing: transaction?.listing?.attributes,
    booking: transaction?.booking?.attributes,
    protectedData: transaction?.attributes?.protectedData,
    timestamp: new Date().toISOString(),
  });

  dispatch(
    logSenpexOrderCreation({
      transactionId: transaction?.id?.uuid,
      processName: transaction?.attributes?.processName,
      lastTransition: transaction?.attributes?.lastTransition,
      customer: transaction?.customer?.attributes,
      provider: transaction?.provider?.attributes,
      listing: transaction?.listing?.attributes,
      booking: transaction?.booking?.attributes,
      protectedData: transaction?.attributes?.protectedData,
      timestamp: new Date().toISOString(),
    })
  );

  // Now create the actual Senpex order (don't let this fail the transaction acceptance)
  return dispatch(createSenpexOrderForBooking(transaction)).catch((error) => {
    console.error(
      'Senpex order creation failed, but transaction acceptance continues:',
      error
    );
    // Don't rethrow - we don't want Senpex failures to break the main transaction flow
  });
};
