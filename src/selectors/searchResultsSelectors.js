import { createSelector } from 'reselect';

export const getBookingDeliveryAddress = createSelector(
  state => state.user.currentUser.attributes.profile.publicData,
  publicData => publicData.deliveryAddress
);
