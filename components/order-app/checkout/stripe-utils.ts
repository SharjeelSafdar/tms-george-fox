import { toJS } from 'mobx';
import OrderStore from '../stores/order-store';
import { formatGooglePlacesObj } from '../stores/order-utils';
import { convert24HourTo12Format, extendedDateFormat } from '../stores/date-utils';
import { loadStripe } from '@stripe/stripe-js';
import * as Sentry from '@sentry/browser';
import { OrderRequest, ShoppingCart } from '../../../pages/api/stripe/order-utils';

const serializeOrderStore = (orderStore: typeof OrderStore): OrderRequest => {
  const orderRequest: OrderRequest = {
    orderType: orderStore.orderType,
    contactName: orderStore.fulfillment.contactName,
    fulfillmentTime: convert24HourTo12Format(OrderStore.fulfillment.dateStore.fulfillmentTimeAndDate),
    fulfillmentDate: extendedDateFormat(OrderStore.fulfillment.dateStore.fulfillmentTimeAndDate),
    contactNumber: orderStore.fulfillment.contactNumber,
    specialInstructions: orderStore.fulfillment.specialInstructions,
    fulfillmentOption: orderStore.fulfillment.option,
    shoppingCart: toJS(orderStore.shoppingCart).map((item, index) => {
      return {
        ...item,
        total: orderStore.shoppingCart[index].total,
      };
    }) as ShoppingCart,
    tip: orderStore.registerStore.tip,
    tax: orderStore.registerStore.tax,
  };

  if (OrderStore.fulfillment.option === 'delivery') {
    orderRequest.deliveryLocation = formatGooglePlacesObj(orderStore.fulfillment.deliveryLocation);
    orderRequest.deliveryFee = orderStore.registerStore.deliveryFee as number;
    orderRequest.numberOfGuests = orderStore.fulfillment.numberOfGuests;
  }

  console.log(orderRequest);
  return orderRequest;
};

export default async function handleCheckoutRequest(
  showSpinner: React.Dispatch<React.SetStateAction<boolean>>,
  showError: React.Dispatch<React.SetStateAction<boolean>>,
) {
  showSpinner(true);
  try {
    const res = await fetch('/api/stripe/order', {
      headers: {
        'Content-Type': 'application/json',
      },
      method: 'post',
      body: JSON.stringify(serializeOrderStore(OrderStore)),
    });
    const jsonResponse = await res.json();
    if (!res.ok) {
      throw Error(`Error from Firebase Func: ${jsonResponse.error}`);
    }
    const stripe = await loadStripe('pk_live_ivfkFrzhLuZbUiZRVkvsBwI3');
    // const stripe = await loadStripe('pk_test_OaDvLsgEGQbshVWpSFMQMm1k');
    if (!stripe) throw new Error("Couldn't load stripe");

    const result = await stripe.redirectToCheckout({
      sessionId: jsonResponse.id,
    });

    if (result.error.message) {
      throw new Error(result.error.message);
    }
  } catch (e) {
    showSpinner(false);
    showError(true);
    console.error(e);
    Sentry.captureException({
      event_id: 'handleCheckoutRequest error',
      message: `${e} :: OrderStore: ${JSON.stringify(serializeOrderStore(OrderStore))}`,
    });
  }
}
