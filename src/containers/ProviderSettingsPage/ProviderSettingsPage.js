import React from 'react';
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
import { isScrollingDisabled } from '../../ducks/ui.duck';

import { H3, Page, UserNav, LayoutSideNavigation } from '../../components';

import TopbarContainer from '../../containers/TopbarContainer/TopbarContainer';
import FooterContainer from '../../containers/FooterContainer/FooterContainer';

import ProviderSettingsForm from './ProviderSettingsForm/ProviderSettingsForm';

import {
  saveProviderSettings,
  saveProviderSettingsClear,
} from './ProviderSettingsPage.duck';
import css from './ProviderSettingsPage.module.css';

export const ProviderSettingsPageComponent = (props) => {
  const config = useConfiguration();
  const intl = useIntl();
  const {
    saveProviderSettingsError,
    saveProviderSettingsInProgress,
    currentUser,
    providerSettingsChanged,
    onChange,
    scrollingDisabled,
    onSubmitProviderSettings,
  } = props;

  const user = ensureCurrentUser(currentUser);
  const publicData = user.attributes.profile.publicData || {};

  const handleSubmit = (values) => {
    const pub_providerAddress = values.pub_providerAddress || null;
    const apartmentUnit = values.apartmentUnit?.trim() || null;

    onSubmitProviderSettings({
      ...values,
      pub_providerAddress,
      apartmentUnit,
      currentProviderAddress: publicData?.providerAddress,
      currentApartmentUnit: publicData?.apartmentUnit,
    });
  };

  const providerSettingsForm = user.id ? (
    <ProviderSettingsForm
      className={css.form}
      initialValues={{
        pub_providerAddress: publicData?.providerAddress,
        apartmentUnit: publicData?.apartmentUnit,
      }}
      saveProviderSettingsError={saveProviderSettingsError}
      currentUser={currentUser}
      onSubmit={handleSubmit}
      onChange={onChange}
      inProgress={saveProviderSettingsInProgress}
      ready={providerSettingsChanged}
    />
  ) : null;

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
          {providerSettingsForm}
        </div>
      </LayoutSideNavigation>
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
});

const ProviderSettingsPage = compose(
  connect(mapStateToProps, mapDispatchToProps)
)(ProviderSettingsPageComponent);

ProviderSettingsPage.displayName = 'ProviderSettingsPage';

export default ProviderSettingsPage;
