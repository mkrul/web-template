import React, { useState } from 'react';
import { compose } from 'redux';
import { connect } from 'react-redux';

import { useConfiguration } from '../../context/configurationContext';

import { FormattedMessage, useIntl } from '../../util/reactIntl';
import { propTypes } from '../../util/types';
import { ensureCurrentUser } from '../../util/data';
import {
  showCreateListingLinkForUser,
  showPaymentDetailsForUser,
} from '../../util/userHelpers';

import { sendVerificationEmail } from '../../ducks/user.duck';
import { isScrollingDisabled, manageDisableScrolling } from '../../ducks/ui.duck';

import { H3, Page, UserNav, LayoutSideNavigation } from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import ProviderSettingsForm from './ProviderSettingsForm/ProviderSettingsForm';
import ProviderAddressConfirmationModal from './ProviderAddressConfirmationModal/ProviderAddressConfirmationModal';

import {
  saveProviderSettings,
  saveProviderSettingsClear,
} from './ProviderSettingsPage.duck';
import css from './ProviderSettingsPage.module.css';

export const ProviderSettingsPageComponent = (props) => {
  const config = useConfiguration();
  const intl = useIntl();
  const [isConfirmationModalOpen, setIsConfirmationModalOpen] = useState(false);
  const [pendingFormValues, setPendingFormValues] = useState(null);
  
  const {
    saveProviderSettingsError,
    saveProviderSettingsInProgress,
    currentUser,
    providerSettingsChanged,
    onChange,
    scrollingDisabled,
    onSubmitProviderSettings,
    onManageDisableScrolling,
  } = props;

  // Guard against undefined currentUser
  if (!currentUser) {
    console.log('ProviderSettings: currentUser is null/undefined');
    return (
      <Page title="Provider Settings" scrollingDisabled={scrollingDisabled}>
        <LayoutSideNavigation
          topbar={<TopbarContainer />}
          sideNav={null}
          useAccountSettingsNav
          accountSettingsNavProps={{ currentPage: 'ProviderSettingsPage' }}
          footer={<FooterContainer />}
        >
          <div className={css.content}>
            <H3 as="h1" className={css.heading}>
              <FormattedMessage id="ProviderSettingsPage.heading" />
            </H3>
            <div>Loading user data...</div>
          </div>
        </LayoutSideNavigation>
      </Page>
    );
  }

  const user = ensureCurrentUser(currentUser);
  console.log('ProviderSettings: User object after ensureCurrentUser:', user);

  // Additional guard to ensure user has the expected structure
  if (!user?.attributes?.profile) {
    console.log('ProviderSettings: user.attributes.profile is missing:', user);
    return (
      <Page title="Provider Settings" scrollingDisabled={scrollingDisabled}>
        <LayoutSideNavigation
          topbar={<TopbarContainer />}
          sideNav={null}
          useAccountSettingsNav
          accountSettingsNavProps={{ currentPage: 'ProviderSettingsPage' }}
          footer={<FooterContainer />}
        >
          <div className={css.content}>
            <H3 as="h1" className={css.heading}>
              <FormattedMessage id="ProviderSettingsPage.heading" />
            </H3>
            <div>Loading user profile data...</div>
          </div>
        </LayoutSideNavigation>
      </Page>
    );
  }

  const publicData = user.attributes.profile.publicData || {};
  console.log('ProviderSettings: publicData:', publicData);

  const handleSubmit = (values) => {
    const pub_providerAddress = values.pub_providerAddress || null;
    const apartmentUnit = values.apartmentUnit?.trim() || null;

    // Check if address has changed
    const currentAddressSearch =
      publicData?.providerAddress?.search || publicData?.providerAddress || '';
    const newAddressSearch = pub_providerAddress?.search || '';
    const addressChanged = newAddressSearch !== currentAddressSearch;
    const apartmentChanged = apartmentUnit !== publicData?.apartmentUnit;

    // If address or apartment changed, show confirmation modal
    if (addressChanged || apartmentChanged) {
      setPendingFormValues({
        ...values,
        pub_providerAddress,
        apartmentUnit,
        currentProviderAddress: publicData?.providerAddress,
        currentApartmentUnit: publicData?.apartmentUnit,
      });
      setIsConfirmationModalOpen(true);
    } else {
      // No changes, submit directly
      onSubmitProviderSettings({
        ...values,
        pub_providerAddress,
        apartmentUnit,
        currentProviderAddress: publicData?.providerAddress,
        currentApartmentUnit: publicData?.apartmentUnit,
      });
    }
  };

  const handleConfirmUpdate = () => {
    if (pendingFormValues) {
      onSubmitProviderSettings(pendingFormValues);
      setIsConfirmationModalOpen(false);
      setPendingFormValues(null);
    }
  };

  const handleCloseModal = () => {
    setIsConfirmationModalOpen(false);
    setPendingFormValues(null);
  };

  // Ensure address data is properly formatted for LocationAutocompleteInput
  const formatAddressForForm = (addressData) => {
    if (!addressData) return null;

    // If the address data already has the correct structure, use it as is
    if (addressData.search && addressData.selectedPlace) {
      return addressData;
    }

    // If it's just a string, create a basic structure
    if (typeof addressData === 'string') {
      return {
        search: addressData,
        predictions: [],
        selectedPlace: {
          address: addressData,
          origin: null, // Will need to be validated again if user changes
        },
      };
    }

    return null;
  };

  const providerSettingsForm = user.id ? (
    <ProviderSettingsForm
      className={css.form}
      initialValues={{
        pub_providerAddress: formatAddressForForm(publicData?.providerAddress),
        apartmentUnit: publicData?.apartmentUnit,
      }}
      saveProviderSettingsError={saveProviderSettingsError}
      currentUser={currentUser}
      onSubmit={handleSubmit}
      onChange={onChange}
      inProgress={saveProviderSettingsInProgress}
      ready={providerSettingsChanged}
    />
  ) : (
    <div>Loading user data...</div>
  );

  const title = intl.formatMessage({ id: 'ProviderSettingsPage.title' });

  const showManageListingsLink = showCreateListingLinkForUser(
    config,
    currentUser
  );
  const { showPayoutDetails, showPaymentMethods } = showPaymentDetailsForUser(
    config,
    currentUser
  );

  const accountSettingsNavProps = {
    currentPage: 'ProviderSettingsPage',
    showPaymentMethods,
    showPayoutDetails,
  };

  return (
    <Page title={title} scrollingDisabled={scrollingDisabled}>
      <LayoutSideNavigation
        topbar={
          <>
            <TopbarContainer
              desktopClassName={css.desktopTopbar}
              mobileClassName={css.mobileTopbar}
            />
            <UserNav
              currentPage="ProviderSettingsPage"
              showManageListingsLink={showManageListingsLink}
            />
          </>
        }
        sideNav={null}
        useAccountSettingsNav
        accountSettingsNavProps={accountSettingsNavProps}
        footer={<FooterContainer />}
      >
        <div className={css.content}>
          <H3 as="h1" className={css.heading}>
            <FormattedMessage id="ProviderSettingsPage.heading" />
          </H3>
          {providerSettingsChanged && (
            <div className={css.successMessage}>
              <FormattedMessage id="ProviderSettingsForm.listingsUpdatedSuccess" />
            </div>
          )}
          {providerSettingsForm}
        </div>
      </LayoutSideNavigation>
      
      <ProviderAddressConfirmationModal
        id="ProviderAddressConfirmationModal"
        isOpen={isConfirmationModalOpen}
        onCloseModal={handleCloseModal}
        onManageDisableScrolling={onManageDisableScrolling}
        onConfirmUpdate={handleConfirmUpdate}
        updateInProgress={saveProviderSettingsInProgress}
      />
    </Page>
  );
};

const mapStateToProps = (state) => {
  const {
    saveProviderSettingsError,
    saveProviderSettingsInProgress,
    providerSettingsChanged,
  } = state.ProviderSettingsPage;
  const { currentUser } = state.user;
  return {
    saveProviderSettingsError,
    saveProviderSettingsInProgress,
    providerSettingsChanged,
    currentUser,
    scrollingDisabled: isScrollingDisabled(state),
  };
};

const mapDispatchToProps = (dispatch) => ({
  onChange: () => dispatch(saveProviderSettingsClear()),
  onSubmitProviderSettings: (values) => dispatch(saveProviderSettings(values)),
  onManageDisableScrolling: (componentId, disableScrolling) =>
    dispatch(manageDisableScrolling(componentId, disableScrolling)),
});

const ProviderSettingsPage = compose(
  connect(mapStateToProps, mapDispatchToProps)
)(ProviderSettingsPageComponent);

ProviderSettingsPage.displayName = 'ProviderSettingsPage';

export default ProviderSettingsPage;
