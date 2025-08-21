import React, { act } from 'react';
import '@testing-library/jest-dom';

import { createCurrentUser, fakeIntl } from '../../util/testData';
import {
  renderWithProviders as render,
  testingLibrary,
} from '../../util/testHelpers';

import { AccountSettingsPageComponent } from './AccountSettingsPage';

const { screen, userEvent } = testingLibrary;

const noop = () => null;

describe('AccountSettingsPageComponent', () => {
  it('Check that newPassword input shows error and submit is enabled if form is filled', async () => {
    render(
      <AccountSettingsPageComponent
        params={{ displayName: 'my-shop' }}
        history={{ push: noop }}
        location={{ search: '' }}
        scrollingDisabled={false}
        authInProgress={false}
        currentUser={createCurrentUser('user1')}
        isAuthenticated={false}
        onChange={noop}
        onLogout={noop}
        onManageDisableScrolling={noop}
        sendVerificationEmailInProgress={false}
        onResendVerificationEmail={noop}
        onSubmitContactDetails={noop}
        saveContactDetailsInProgress={false}
        contactDetailsChanged={false}
        intl={fakeIntl}
      />
    );

    const emailLabel = 'ContactDetailsForm.emailLabel';
    const emailInput = screen.getByText(emailLabel);
    expect(emailInput).toBeInTheDocument();

    // Save button is disabled
    expect(
      screen.getByRole('button', { name: 'ContactDetailsForm.saveChanges' })
    ).toBeDisabled();

    const phoneLabel = 'ContactDetailsForm.phoneLabel';
    const phoneInput = screen.getByText(phoneLabel);

    await act(async () => {
      userEvent.type(phoneInput, '+358555555555');
      phoneInput.blur();
    });

    // Save button is enabled
    expect(
      screen.getByRole('button', { name: 'ContactDetailsForm.saveChanges' })
    ).toBeEnabled();
  });
});
