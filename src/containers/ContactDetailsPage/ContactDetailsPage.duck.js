import merge from 'lodash/merge';
import { denormalisedResponseEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import {
  fetchCurrentUser,
  currentUserShowSuccess,
} from '../../ducks/user.duck';

// ================ Action types ================ //

export const SAVE_CONTACT_DETAILS_REQUEST =
  'app/ContactDetailsPage/SAVE_CONTACT_DETAILS_REQUEST';
export const SAVE_CONTACT_DETAILS_SUCCESS =
  'app/ContactDetailsPage/SAVE_CONTACT_DETAILS_SUCCESS';
export const SAVE_EMAIL_ERROR = 'app/ContactDetailsPage/SAVE_EMAIL_ERROR';

export const SAVE_CONTACT_DETAILS_CLEAR =
  'app/ContactDetailsPage/SAVE_CONTACT_DETAILS_CLEAR';

export const CHANGE_PASSWORD_REQUEST =
  'app/ContactDetailsPage/CHANGE_PASSWORD_REQUEST';
export const CHANGE_PASSWORD_SUCCESS =
  'app/ContactDetailsPage/CHANGE_PASSWORD_SUCCESS';
export const CHANGE_PASSWORD_ERROR =
  'app/ContactDetailsPage/CHANGE_PASSWORD_ERROR';

export const RESET_PASSWORD_REQUEST =
  'app/ContactDetailsPage/RESET_PASSWORD_REQUEST';
export const RESET_PASSWORD_SUCCESS =
  'app/ContactDetailsPage/RESET_PASSWORD_SUCCESS';
export const RESET_PASSWORD_ERROR =
  'app/ContactDetailsPage/RESET_PASSWORD_ERROR';

// ================ Reducer ================ //

const initialState = {
  saveEmailError: null,
  saveContactDetailsInProgress: false,
  contactDetailsChanged: false,
  changePasswordError: null,
  changePasswordInProgress: false,
  passwordChanged: false,
  resetPasswordInProgress: false,
  resetPasswordError: null,
};

export default function reducer(state = initialState, action = {}) {
  const { type, payload } = action;
  switch (type) {
    case SAVE_CONTACT_DETAILS_REQUEST:
      return {
        ...state,
        saveContactDetailsInProgress: true,
        saveEmailError: null,
        contactDetailsChanged: false,
      };
    case SAVE_CONTACT_DETAILS_SUCCESS:
      return {
        ...state,
        saveContactDetailsInProgress: false,
        contactDetailsChanged: true,
      };
    case SAVE_EMAIL_ERROR:
      return {
        ...state,
        saveContactDetailsInProgress: false,
        saveEmailError: payload,
      };

    case CHANGE_PASSWORD_REQUEST:
      return {
        ...state,
        changePasswordInProgress: true,
        changePasswordError: null,
        passwordChanged: false,
      };
    case CHANGE_PASSWORD_SUCCESS:
      return {
        ...state,
        changePasswordInProgress: false,
        passwordChanged: true,
      };
    case CHANGE_PASSWORD_ERROR:
      return {
        ...state,
        changePasswordInProgress: false,
        changePasswordError: payload,
      };

    case SAVE_CONTACT_DETAILS_CLEAR:
      return {
        ...state,
        saveContactDetailsInProgress: false,
        saveEmailError: null,
        contactDetailsChanged: false,
        changePasswordError: null,
        changePasswordInProgress: false,
        passwordChanged: false,
      };

    case RESET_PASSWORD_REQUEST:
      return {
        ...state,
        resetPasswordInProgress: true,
        resetPasswordError: null,
      };
    case RESET_PASSWORD_SUCCESS:
      return { ...state, resetPasswordInProgress: false };
    case RESET_PASSWORD_ERROR:
      console.error(payload); // eslint-disable-line no-console
      return {
        ...state,
        resetPasswordInProgress: false,
        resetPasswordError: payload,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const saveContactDetailsRequest = () => ({
  type: SAVE_CONTACT_DETAILS_REQUEST,
});
export const saveContactDetailsSuccess = () => ({
  type: SAVE_CONTACT_DETAILS_SUCCESS,
});
export const saveEmailError = (error) => ({
  type: SAVE_EMAIL_ERROR,
  payload: error,
  error: true,
});

export const saveContactDetailsClear = () => ({
  type: SAVE_CONTACT_DETAILS_CLEAR,
});

export const changePasswordRequest = () => ({ type: CHANGE_PASSWORD_REQUEST });
export const changePasswordSuccess = () => ({ type: CHANGE_PASSWORD_SUCCESS });
export const changePasswordError = (error) => ({
  type: CHANGE_PASSWORD_ERROR,
  payload: error,
  error: true,
});

export const resetPasswordRequest = () => ({ type: RESET_PASSWORD_REQUEST });

export const resetPasswordSuccess = () => ({ type: RESET_PASSWORD_SUCCESS });

export const resetPasswordError = (e) => ({
  type: RESET_PASSWORD_ERROR,
  error: true,
  payload: e,
});

// ================ Thunks ================ //

/**
 * Make a email update request to the API and return the current user.
 */
const requestSaveEmail = (params) => (dispatch, getState, sdk) => {
  const { email, currentPassword } = params;

  return sdk.currentUser
    .changeEmail(
      { email, currentPassword },
      {
        expand: true,
        include: ['profileImage'],
        'fields.image': ['variants.square-small', 'variants.square-small2x'],
      }
    )
    .then((response) => {
      const entities = denormalisedResponseEntities(response);
      if (entities.length !== 1) {
        throw new Error(
          'Expected a resource in the sdk.currentUser.changeEmail response'
        );
      }

      const currentUser = entities[0];
      return currentUser;
    })
    .catch((e) => {
      dispatch(saveEmailError(storableError(e)));
      // pass the same error so that the SAVE_CONTACT_DETAILS_SUCCESS
      // action will not be fired
      throw e;
    });
};

/**
 * Save email and update the current user.
 */
const saveEmail = (params) => (dispatch, getState, sdk) => {
  return (
    dispatch(requestSaveEmail(params))
      .then((user) => {
        dispatch(currentUserShowSuccess(user));
        dispatch(saveContactDetailsSuccess());
      })
      // error action dispatched in requestSaveEmail
      .catch((e) => null)
  );
};

/**
 * Save address information and update the current user.
 */
const saveAddress = (params) => (dispatch, getState, sdk) => {
  const { pub_providerAddress, apartmentUnit } = params;

  return sdk.currentUser
    .updateProfile(
      {
        publicData: {
          providerAddress: pub_providerAddress,
          apartmentUnit: apartmentUnit?.trim() || null,
        },
      },
      {
        expand: true,
        include: ['profileImage'],
        'fields.image': ['variants.square-small', 'variants.square-small2x'],
      }
    )
    .then((response) => {
      const entities = denormalisedResponseEntities(response);
      if (entities.length !== 1) {
        throw new Error(
          'Expected a resource in the sdk.currentUser.updateProfile response'
        );
      }

      const currentUser = entities[0];
      dispatch(currentUserShowSuccess(currentUser));
      dispatch(saveContactDetailsSuccess());
    })
    .catch((e) => {
      // For now, we'll use the same error handling as phone number
      dispatch(savePhoneNumberError(storableError(e)));
      throw e;
    });
};

/**
 * Change password
 */
export const changePassword = (params) => (dispatch, getState, sdk) => {
  dispatch(changePasswordRequest());
  const { newPassword, currentPassword } = params;

  return sdk.currentUser
    .changePassword({ newPassword, currentPassword })
    .then(() => dispatch(changePasswordSuccess()))
    .catch((e) => {
      dispatch(changePasswordError(storableError(e)));
      throw e;
    });
};

/**
 * Update contact details, actions depend on which data has changed
 */
export const saveContactDetails = (params) => (dispatch, getState, sdk) => {
  dispatch(saveContactDetailsRequest());

  const {
    email,
    currentEmail,
    currentPassword,
    newPassword,
    pub_providerAddress,
    apartmentUnit,
    currentAddress,
    currentApartmentUnit,
  } = params;

  const emailChanged = email !== currentEmail;
  const passwordChanged = newPassword && newPassword.trim() !== '';
  const addressChanged =
    pub_providerAddress !== currentAddress ||
    apartmentUnit !== currentApartmentUnit;

  if (passwordChanged) {
    return dispatch(changePassword({ newPassword, currentPassword }));
  } else if (emailChanged) {
    return dispatch(saveEmail({ email, currentPassword }));
  } else if (addressChanged) {
    return dispatch(saveAddress({ pub_providerAddress, apartmentUnit }));
  }
};

export const resetPassword = (email) => (dispatch, getState, sdk) => {
  dispatch(resetPasswordRequest());
  return sdk.passwordReset
    .request({ email })
    .then(() => dispatch(resetPasswordSuccess()))
    .catch((e) => dispatch(resetPasswordError(storableError(e))));
};

export const loadData = () => {
  // Since verify email happens in separate tab, current user's data might be updated
  return fetchCurrentUser();
};
