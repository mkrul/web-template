import { bool, func, oneOf, shape, string } from 'prop-types';
import {
  BOOKING_PROCESS_NAME,
  INQUIRY_PROCESS_NAME,
  PURCHASE_PROCESS_NAME,
  resolveLatestProcessName,
} from '../../transactions/transaction';
import { getStateDataForBookingProcess } from './TransactionPage.stateDataBooking.js';
import { getStateDataForInquiryProcess } from './TransactionPage.stateDataInquiry.js';
import { getStateDataForPurchaseProcess } from './TransactionPage.stateDataPurchase.js';

const errorShape = shape({
  type: oneOf(['error']).isRequired,
  name: string.isRequired,
  message: string,
});

const actionButtonsShape = shape({
  inProgress: bool,
  error: errorShape,
  onAction: func.isRequired,
  buttonText: string,
  errorText: string,
});

export const stateDataShape = shape({
  processName: string.isRequired,
  processState: string.isRequired,
  primaryButtonProps: actionButtonsShape,
  secondaryButtonProps: actionButtonsShape,
  showActionButtons: bool,
  showDetailCardHeadings: bool,
  showDispute: bool,
  showOrderPanel: bool,
  showReviewAsFirstLink: bool,
  showReviewAsSecondLink: bool,
  showReviews: bool,
});

// Transitions are following process.edn format: "transition/my-transtion-name"
// This extracts the 'my-transtion-name' string if namespace exists
const getTransitionKey = (transitionName) => {
  const [nameSpace, transitionKey] = transitionName.split('/');
  return transitionKey || transitionName;
};

// Action button prop for the TransactionPanel
const getActionButtonPropsMaybe = (params, onlyForRole = 'both') => {
  const {
    processName,
    transitionName,
    inProgress,
    transitionError,
    onAction,
    transactionRole,
    actionButtonTranslationId,
    actionButtonTranslationErrorId,
    intl,
    transaction,
  } = params;
  const transitionKey = getTransitionKey(transitionName);

  // Validate Senpex shipping for accept transition
  let senpexValidationError = null;
  if (
    transitionName === 'transition/accept' &&
    transactionRole === 'provider'
  ) {
    const deliveryMethod =
      transaction?.attributes?.protectedData?.deliveryMethod;
    const hasSenpexQuote =
      !!transaction?.attributes?.protectedData?.senpexQuote?.token;

    // Check if there are line items with Senpex shipping fee
    const lineItems = transaction?.attributes?.lineItems || [];
    const hasSenpexShippingLineItem = lineItems.some(
      (item) => item.code === 'line-item/senpex-shipping-fee'
    );

    console.log('Senpex validation check:', {
      transitionName,
      transactionRole,
      deliveryMethod,
      hasSenpexQuote,
      transactionId: transaction?.id?.uuid,
      protectedDataKeys: transaction?.attributes?.protectedData
        ? Object.keys(transaction.attributes.protectedData)
        : [],
      fullProtectedData: transaction?.attributes?.protectedData,
      senpexShippingPriceInSubunits:
        transaction?.attributes?.protectedData?.senpexShippingPriceInSubunits,
      hasSenpexQuoteObject:
        !!transaction?.attributes?.protectedData?.senpexQuote,
      hasSenpexShippingLineItem,
      lineItemCodes: lineItems.map((item) => item.code),
      listingHasSenpexEnabled:
        transaction?.listing?.attributes?.publicData?.senpexShipping,
      listingPublicDataKeys: transaction?.listing?.attributes?.publicData
        ? Object.keys(transaction.listing.attributes.publicData)
        : [],
    });

    // Check if this transaction should have Senpex shipping but doesn't have a quote
    // This includes cases where:
    // 1. deliveryMethod is 'senpex-shipping' (correct value from line items)
    // 2. deliveryMethod is 'senpex' (legacy value)
    // 3. We have Senpex shipping price in protected data
    // 4. We have Senpex quote object (even if token is missing)
    // 5. We have a Senpex shipping fee line item
    // 6. The listing has Senpex shipping enabled
    const listingHasSenpexEnabled =
      transaction?.listing?.attributes?.publicData?.senpexShipping;
    const shouldHaveSenpexShipping =
      deliveryMethod === 'senpex-shipping' ||
      deliveryMethod === 'senpex' ||
      transaction?.attributes?.protectedData?.senpexShippingPriceInSubunits ||
      transaction?.attributes?.protectedData?.senpexQuote ||
      hasSenpexShippingLineItem ||
      listingHasSenpexEnabled;

    if (shouldHaveSenpexShipping && !hasSenpexQuote) {
      console.log(
        'Senpex validation failed: transaction should have Senpex shipping but no quote found'
      );
      senpexValidationError = {
        type: 'error',
        name: 'senpex_validation_error',
        message: 'Senpex shipping quote is required but not available',
      };
    }
  }

  const actionButtonTrId =
    actionButtonTranslationId ||
    `TransactionPage.${processName}.${transactionRole}.transition-${transitionKey}.actionButton`;
  const actionButtonTrErrorId =
    actionButtonTranslationErrorId ||
    `TransactionPage.${processName}.${transactionRole}.transition-${transitionKey}.actionError`;

  return onlyForRole === 'both' || onlyForRole === transactionRole
    ? {
        inProgress,
        error: senpexValidationError || transitionError,
        onAction: senpexValidationError ? null : onAction,
        buttonText: intl.formatMessage({ id: actionButtonTrId }),
        errorText: senpexValidationError
          ? intl.formatMessage({ id: 'TransactionPage.senpex.shipping.error' })
          : intl.formatMessage({ id: actionButtonTrErrorId }),
      }
    : {};
};

export const getStateData = (params, process) => {
  const {
    transaction,
    transactionRole,
    intl,
    transitionInProgress,
    transitionError,
    onTransition,
    sendReviewInProgress,
    sendReviewError,
    onOpenReviewModal,
  } = params;
  const isCustomer = transactionRole === 'customer';
  const processName = resolveLatestProcessName(
    transaction?.attributes?.processName
  );

  const getActionButtonProps = (transitionName, forRole, extra = {}) =>
    getActionButtonPropsMaybe(
      {
        processName,
        transitionName,
        transactionRole,
        intl,
        inProgress: transitionInProgress === transitionName,
        transitionError,
        onAction: () => onTransition(transaction?.id, transitionName, {}),
        transaction,
        ...extra,
      },
      forRole
    );

  const getLeaveReviewProps = getActionButtonPropsMaybe({
    processName,
    transitionName: 'leaveReview',
    transactionRole,
    intl,
    inProgress: sendReviewInProgress,
    transitionError: sendReviewError,
    onAction: onOpenReviewModal,
    transaction,
    actionButtonTranslationId: 'TransactionPage.leaveReview.actionButton',
    actionButtonTranslationErrorId: 'TransactionPage.leaveReview.actionError',
  });

  const processInfo = () => {
    const { getState, states, transitions } = process;
    const processState = getState(transaction);
    return {
      processName,
      processState,
      states,
      transitions,
      isCustomer,
      actionButtonProps: getActionButtonProps,
      leaveReviewProps: getLeaveReviewProps,
    };
  };

  if (processName === PURCHASE_PROCESS_NAME) {
    return getStateDataForPurchaseProcess(params, processInfo());
  } else if (processName === BOOKING_PROCESS_NAME) {
    return getStateDataForBookingProcess(params, processInfo());
  } else if (processName === INQUIRY_PROCESS_NAME) {
    return getStateDataForInquiryProcess(params, processInfo());
  } else {
    return {};
  }
};
