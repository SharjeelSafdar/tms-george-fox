import { makeAutoObservable, reaction } from 'mobx';
import ItemStore from './item-store';
import { getNextAvailableFulfillmentDateStr, getNextAvailableFulfillmentTimeStr } from './date-utils';
import DateStore from './date-store';
import FulfillmentStore from './fulfillment-store';
import addZero from '../../../utilities/add-zero';

export type ActiveTab = 'Full menu' | 'Vegetarian' | 'Vegan' | 'Gluten Free' | 'Catering Menu' | 'Checkout';

class OrderStore {
  activeTab: ActiveTab;
  orderType: string;
  shoppingCart: ItemStore[] = [];
  dateStore: DateStore = new DateStore();
  fulfillment: FulfillmentStore = new FulfillmentStore();
  tip: number = 0;

  constructor() {
    makeAutoObservable(this);
    reaction(
      () => this.fulfillment.option,
      () => {
        if (this.dateStore.fulfillmentTime) this.dateStore.validateTime();
      },
    );
  }

  setActiveTab(tab: ActiveTab): void {
    this.activeTab = tab;
  }

  setOrderType(type: string) {
    this.orderType = type;
  }

  initializeModule(catering: boolean | undefined) {
    if ((catering && this.orderType !== 'catering') || (!catering && this.orderType !== 'normal')) {
      this.shoppingCart = []; // clear cart
    }
    if (catering) {
      this.setOrderType('catering');
      this.fulfillment.setFulfillmentOption('delivery');
      this.setActiveTab('Catering Menu');
    } else {
      this.setOrderType('normal');
      this.fulfillment.setFulfillmentOption('pickup');
      this.setActiveTab('Full menu');
    }
    this.dateStore.fulfillmentDate = getNextAvailableFulfillmentDateStr();
    this.dateStore.fulfillmentTime = getNextAvailableFulfillmentTimeStr();
  }

  addToCart(itemStore: ItemStore) {
    this.shoppingCart.push(itemStore);
  }

  get tipPercent() {
    return ((this.tip / Number(this.subTotal)) * 100).toFixed();
  }

  get subTotal() {
    return addZero(parseFloat(this.shoppingCart.reduce((acc, item) => acc + item.total, 0).toFixed(2)));
  }

  get tax() {
    return addZero(parseFloat((Number(this.subTotal) * 0.07).toFixed(2)));
  }

  get grandTotal() {
    let total = Number(this.subTotal) + Number(this.tip) + Number(this.tax);
    if (this.fulfillment.option === 'delivery' && typeof this.deliveryFee === 'number') {
      total += this.deliveryFee;
    }
    return addZero(parseFloat(total.toFixed(2)));
  }

  get inputFieldsReady() {
    const baseQualificationsSatisfied =
      Boolean(this.fulfillment.contactName) &&
      Boolean(this.fulfillment.contactNumber) &&
      Boolean(this.dateStore.fulfillmentDate) &&
      !this.dateStore.fulfillmentDateError &&
      Boolean(this.dateStore.fulfillmentTime) &&
      !this.dateStore.fulfillmentTimeError;
    if (this.orderType === 'normal' || (this.orderType === 'catering' && this.fulfillment.option === 'pickup')) {
      return baseQualificationsSatisfied;
    } else {
      return (
        baseQualificationsSatisfied &&
        Boolean(this.fulfillment.deliveryLocation) &&
        typeof this.deliveryFee === 'number' &&
        Number(this.fulfillment.numberOfGuests) > 0
      );
    }
  }

  setTip(str: string) {
    this.tip = Number(str);
  }

  get deliveryFee(): string | number {
    if (this.fulfillment.loadingMiles) {
      return 'Calculating cost ⌛';
    }

    if (!this.fulfillment.deliveryLocation) {
      return 'Select delivery location';
    }

    if (this.fulfillment.errorFromGoogle) {
      return '🚫 error with Google Maps';
    }

    if (this.fulfillment.deliveryMiles < 10) {
      if (Number(this.subTotal) >= 150) {
        return 20;
      } else {
        return '⚠️ Minimum cart total for this distance is $150';
      }
    } else if (this.fulfillment.deliveryMiles < 15) {
      if (Number(this.subTotal) >= 175) {
        return 25;
      } else {
        return '⚠️ Minimum cart total for this distance is $175';
      }
    } else if (this.fulfillment.deliveryMiles < 21) {
      if (Number(this.subTotal) >= 200) {
        return 40;
      } else {
        return '⚠️ Minimum cart total for this distance is $200';
      }
    } else {
      return 'Distance beyond 20 miles. Call 📞 the Meatball Stoppe to place order.';
    }
  }
}

export default new OrderStore();
