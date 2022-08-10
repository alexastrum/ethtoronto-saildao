import { connect, Contract, keyStores, WalletConnection } from 'near-api-js';
import { getConfig } from './near-config';

const nearConfig = getConfig(process.env.NODE_ENV || 'development');

// Initialize contract & set global variables
export async function initContract() {
  // Initialize connection to the NEAR testnet
  const near = await connect(Object.assign({ deps: { keyStore: new keyStores.BrowserLocalStorageKeyStore() } }, nearConfig));

  // Initializing Wallet based Account. It can work with NEAR testnet wallet that
  // is hosted at https://wallet.testnet.near.org
  window.walletConnection = new WalletConnection(near);

  // Getting the Account ID. If still unauthorized, it's just empty string
  window.accountId = window.walletConnection.getAccountId();

  // Initializing our contract APIs by contract name and configuration
  window.contract = await new Contract(window.walletConnection.account(), nearConfig.contractName, {
    // View methods are read only. They don't modify the state, but usually return some value.
    viewMethods: ['get_booking_cost', 'get_booking'],
    // Change methods can modify the state. But you don't receive the returned value when called.
    changeMethods: ['book'],
  });
}

export function signOutNearWallet() {
  window.walletConnection.signOut();
  // reload page
  window.location.replace(window.location.origin + window.location.pathname);
}

export function signInWithNearWallet() {
  // Allow the current app to make calls to the specified contract on the
  // user's behalf.
  // This works by creating a new access key for the user's account and storing
  // the private key in localStorage.
  window.walletConnection.requestSignIn(nearConfig.contractName);
}

/**
 * 
 * @param {Date} date 
 * @returns 
 */
export async function bookBoat(date = new Date()) {
  let response = await window.contract.book({
    amount: await getBookingCost(),
    args: { year: date.getUTCFullYear(), month: date.getUTCMonth(), day: date.getUTCDay(), hour: date.getUTCHours() }
  });
  return response;
}

export async function getBookingCost() {
  let cost = await window.contract.get_booking_cost();
  return cost;
}

export async function getBookingsForDay(date = new Date()) {
  // return window.contract.get_booking(
  //   { year: date.getUTCFullYear(), month: date.getUTCMonth(), day: date.getUTCDay(), hour: date.getUTCHours() }
  // );
  return (await Promise.all(new Array(24).fill().map((_, i) =>
    window.contract.get_booking({
      year: date.getUTCFullYear(), month: date.getUTCMonth(), day: date.getUTCDay(), hour: i
    }
    )
  )));
}