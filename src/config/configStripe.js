/* Stripe related configuration.

NOTE: REACT_APP_STRIPE_PUBLISHABLE_KEY is mandatory environment variable.
This variable is set in a hidden file: .env
To make Stripe connection work, you also need to set Stripe's private key in the Sharetribe Console.
*/

export const publishableKey = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY;

// A maximum number of days forwards during which a booking can be made.
// This is limited due to Stripe holding funds up to 90 days from the
// moment they are charged. However, US accounts can hold funds up to 2 years.
// https://docs.stripe.com/connect/manual-payouts
//
// If your marketplace is for US only, you should also be aware that available
// time slots can only be fetched for 366 days into the future.
// https://www.sharetribe.com/api-reference/marketplace.html#query-time-slots
export const dayCountAvailableForBooking = 90;

/**
 * Default merchant category code (MCC)
 * MCCs are used to classify businesses by the type of goods or services they provide.
 *
 * In this template, we use code 5734 Computer Software Stores as a default for all the connected accounts.
 *
 * See the whole list of MCC codes from https://stripe.com/docs/connect/setting-mcc#list
 */
export const defaultMCC = '5734';

/*
Stripe only supports payments in certain countries, see full list
at https://stripe.com/global

You can find the bank account formats from https://stripe.com/docs/connect/payouts-bank-accounts
*/

export const supportedCountries = [
  {
    // United States
    code: 'US',
    currency: 'USD',
    accountConfig: {
      routingNumber: true,
      accountNumber: true,
    },
  },
];
