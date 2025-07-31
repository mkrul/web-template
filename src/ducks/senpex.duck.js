import { denormalisedResponseEntities } from '../util/data';
import { storableError } from '../util/errors';

// ================ Action types ================ //

export const SENPEX_QUOTE_REQUEST = 'app/senpex/SENPEX_QUOTE_REQUEST';
export const SENPEX_QUOTE_SUCCESS = 'app/senpex/SENPEX_QUOTE_SUCCESS';
export const SENPEX_QUOTE_ERROR = 'app/senpex/SENPEX_QUOTE_ERROR';

export const SENPEX_CONFIRM_REQUEST = 'app/senpex/SENPEX_CONFIRM_REQUEST';
export const SENPEX_CONFIRM_SUCCESS = 'app/senpex/SENPEX_CONFIRM_SUCCESS';
export const SENPEX_CONFIRM_ERROR = 'app/senpex/SENPEX_CONFIRM_ERROR';

export const SENPEX_CLEAR_QUOTE = 'app/senpex/SENPEX_CLEAR_QUOTE';

// ================ Reducer ================ //

const initialState = {
  quoteInProgress: false,
  quoteError: null,
  currentQuote: null,
  confirmInProgress: false,
  confirmError: null,
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

// ================ Thunks ================ //

export const getSenpexQuote = (quoteData) => (dispatch, getState, sdk) => {
  dispatch(senpexQuoteRequest());

  return sdk.senpex
    .quote(quoteData)
    .then((response) => {
      dispatch(senpexQuoteSuccess(response.data));
      return response;
    })
    .catch((error) => {
      dispatch(senpexQuoteError(storableError(error)));
      throw error;
    });
};

export const confirmSenpexOrder = (orderData) => (dispatch, getState, sdk) => {
  dispatch(senpexConfirmRequest());

  return sdk.senpex
    .confirm(orderData)
    .then((response) => {
      dispatch(senpexConfirmSuccess());
      return response;
    })
    .catch((error) => {
      dispatch(senpexConfirmError(storableError(error)));
      throw error;
    });
};
