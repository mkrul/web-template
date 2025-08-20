import { updatedEntities, denormalisedEntities } from '../../util/data';
import { storableError } from '../../util/errors';
import { currentUserShowSuccess } from '../../ducks/user.duck';

// ================ Action types ================ //

export const SAVE_PROVIDER_SETTINGS_REQUEST =
  'app/ProviderSettingsPage/SAVE_PROVIDER_SETTINGS_REQUEST';
export const SAVE_PROVIDER_SETTINGS_SUCCESS =
  'app/ProviderSettingsPage/SAVE_PROVIDER_SETTINGS_SUCCESS';
export const SAVE_PROVIDER_SETTINGS_ERROR =
  'app/ProviderSettingsPage/SAVE_PROVIDER_SETTINGS_ERROR';
export const SAVE_PROVIDER_SETTINGS_CLEAR =
  'app/ProviderSettingsPage/SAVE_PROVIDER_SETTINGS_CLEAR';

// ================ Reducer ================ //

const initialState = {
  saveProviderSettingsError: null,
  saveProviderSettingsInProgress: false,
  providerSettingsChanged: false,
};

export default function providerSettingsPageReducer(
  state = initialState,
  action = {}
) {
  const { type, payload } = action;
  switch (type) {
    case SAVE_PROVIDER_SETTINGS_REQUEST:
      return {
        ...state,
        saveProviderSettingsInProgress: true,
        saveProviderSettingsError: null,
        providerSettingsChanged: false,
      };
    case SAVE_PROVIDER_SETTINGS_SUCCESS:
      return {
        ...state,
        saveProviderSettingsInProgress: false,
        providerSettingsChanged: true,
      };
    case SAVE_PROVIDER_SETTINGS_ERROR:
      return {
        ...state,
        saveProviderSettingsInProgress: false,
        saveProviderSettingsError: payload,
      };

    case SAVE_PROVIDER_SETTINGS_CLEAR:
      return {
        ...state,
        providerSettingsChanged: false,
        saveProviderSettingsError: null,
      };

    default:
      return state;
  }
}

// ================ Action creators ================ //

export const saveProviderSettingsRequest = () => ({
  type: SAVE_PROVIDER_SETTINGS_REQUEST,
});
export const saveProviderSettingsSuccess = () => ({
  type: SAVE_PROVIDER_SETTINGS_SUCCESS,
});
export const saveProviderSettingsError = (error) => ({
  type: SAVE_PROVIDER_SETTINGS_ERROR,
  payload: error,
  error: true,
});

export const saveProviderSettingsClear = () => ({
  type: SAVE_PROVIDER_SETTINGS_CLEAR,
});

// ================ Thunks ================ //

export const saveProviderSettings = (params) => (dispatch, getState, sdk) => {
  dispatch(saveProviderSettingsRequest());
  const {
    pub_providerAddress,
    apartmentUnit,
    currentProviderAddress,
    currentApartmentUnit,
  } = params;

  // Only update if address fields have changed
  const addressChanged = pub_providerAddress !== currentProviderAddress;
  const apartmentChanged = apartmentUnit !== currentApartmentUnit;

  if (!addressChanged && !apartmentChanged) {
    dispatch(saveProviderSettingsSuccess());
    return Promise.resolve();
  }

  const bodyParams = {
    publicData: {},
  };

  if (addressChanged) {
    bodyParams.publicData.providerAddress = pub_providerAddress;
  }
  if (apartmentChanged) {
    bodyParams.publicData.apartmentUnit = apartmentUnit;
  }

  return sdk.currentUser
    .updateProfile(bodyParams)
    .then((response) => {
      dispatch(saveProviderSettingsSuccess());

      const entities = denormalisedEntities(response.data);
      const currentUser = entities[0];
      const { id, type, attributes } = currentUser;
      dispatch(currentUserShowSuccess({ id, type, attributes }));
    })
    .catch((e) => {
      dispatch(saveProviderSettingsError(storableError(e)));
    });
};
