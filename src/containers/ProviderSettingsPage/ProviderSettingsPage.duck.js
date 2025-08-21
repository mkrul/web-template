import { denormalisedResponseEntities } from '../../util/data';
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
        saveProviderSettingsError: null,
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
  const currentAddressSearch =
    currentProviderAddress?.search || currentProviderAddress || '';
  const newAddressSearch = pub_providerAddress?.search || '';
  const addressChanged = newAddressSearch !== currentAddressSearch;
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
      const entities = denormalisedResponseEntities(response);
      if (entities.length !== 1) {
        throw new Error(
          'Expected a resource in the sdk.currentUser.updateProfile response'
        );
      }
      const currentUser = entities[0];

      // Get the current user state to preserve existing profile data
      const state = getState();
      const existingUser = state.user.currentUser;

      // Merge the updated profile data with existing data
      const mergedUser = {
        ...currentUser,
        attributes: {
          ...currentUser.attributes,
          profile: {
            ...currentUser.attributes?.profile,
            publicData: {
              ...existingUser?.attributes?.profile?.publicData,
              ...currentUser.attributes?.profile?.publicData,
            },
          },
        },
      };

      dispatch(currentUserShowSuccess(mergedUser));

      // Update all provider's listings if address or apartment unit changed
      if (
        (addressChanged && pub_providerAddress?.selectedPlace) ||
        apartmentChanged
      ) {
        return updateProviderListings(
          dispatch,
          sdk,
          pub_providerAddress,
          apartmentUnit,
          addressChanged,
          apartmentChanged
        );
      }

      dispatch(saveProviderSettingsSuccess());
    })
    .catch((e) => {
      dispatch(saveProviderSettingsError(storableError(e)));
    });
};

// Helper function to update all provider's listings with new address and/or apartment unit
const updateProviderListings = (
  dispatch,
  sdk,
  providerAddress,
  apartmentUnit,
  addressChanged,
  apartmentChanged
) => {
  // Fetch all provider's listings
  return sdk.ownListings
    .query({
      states: ['published', 'draft'],
      perPage: 100, // Adjust based on expected number of listings
      include: ['images'],
    })
    .then((response) => {
      const listings = response.data.data;

      if (listings.length === 0) {
        dispatch(saveProviderSettingsSuccess());
        return;
      }

      // Update each listing with the new provider address and/or apartment unit
      const updatePromises = listings.map((listing) => {
        const listingId = listing.id;

        // Prepare update data for the listing
        const updateData = {
          id: listingId,
          publicData: {
            ...listing.attributes.publicData,
          },
        };

        // Update geolocation if address changed
        if (addressChanged && providerAddress?.selectedPlace?.origin) {
          updateData.geolocation = providerAddress.selectedPlace.origin;
        }

        // Update location data if address or apartment unit changed
        if (addressChanged || apartmentChanged) {
          const currentLocation = listing.attributes.publicData?.location || {};
          updateData.publicData.location = {
            ...currentLocation,
          };

          // Update address if address changed
          if (addressChanged && providerAddress?.selectedPlace?.address) {
            updateData.publicData.location.address =
              providerAddress.selectedPlace.address;
          }

          // Update building (apartment unit) if apartment unit changed
          if (apartmentChanged) {
            updateData.publicData.location.building = apartmentUnit || '';
          }
        }

        return sdk.ownListings
          .update(updateData, { expand: true, include: ['images'] })
          .catch((error) => {
            console.error(`Failed to update listing ${listingId.uuid}:`, error);
            // Continue with other updates even if one fails
            return null;
          });
      });

      return Promise.allSettled(updatePromises);
    })
    .then((results) => {
      // Log results for debugging
      const successful = results.filter(
        (r) => r.status === 'fulfilled' && r.value
      ).length;
      const failed = results.filter(
        (r) => r.status === 'rejected' || !r.value
      ).length;

      console.log(
        `ProviderSettings: Updated ${successful} listings, ${failed} failed`
      );

      dispatch(saveProviderSettingsSuccess());
    })
    .catch((error) => {
      console.error('ProviderSettings: Failed to update listings:', error);
      // Still mark provider settings as successful since the main update worked
      dispatch(saveProviderSettingsSuccess());
    });
};
