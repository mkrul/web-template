import React from 'react';
import { FormattedMessage, intlShape } from '../../util/reactIntl';
import { formatMoney } from '../../util/currency';
import { LINE_ITEM_DELIVERY_FEE, propTypes } from '../../util/types';

import css from './OrderBreakdown.module.css';

const LineItemDeliveryFeeMaybe = (props) => {
  const { lineItems, intl } = props;

  const deliveryFeeLineItem = lineItems.find(
    (item) => item.code === LINE_ITEM_DELIVERY_FEE && !item.reversal
  );

  return deliveryFeeLineItem ? (
    <div className={css.lineItem}>
      <span className={css.itemLabel}>
        <FormattedMessage id="OrderBreakdown.deliveryFee" />
      </span>
      <span className={css.itemValue}>
        {formatMoney(intl, deliveryFeeLineItem.lineTotal)}
      </span>
    </div>
  ) : null;
};

LineItemDeliveryFeeMaybe.propTypes = {
  lineItems: propTypes.lineItems.isRequired,
  intl: intlShape.isRequired,
};

export default LineItemDeliveryFeeMaybe;
