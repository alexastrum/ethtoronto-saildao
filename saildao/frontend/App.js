import 'regenerator-runtime/runtime';
import React from 'react';

import './assets/global.css';

import { getBookingsForDay, bookBoat } from './near-api';
import { EducationalText, SignInPrompt, SignOutButton } from './ui-components';


export default function App() {
  const [valueFromBlockchain, setValueFromBlockchain] = React.useState();

  const [uiPleaseWait, setUiPleaseWait] = React.useState(true);

  // Get blockchian state once on component load
  React.useEffect(() => {
    getBookingsForDay(new Date())
      .then(setValueFromBlockchain)
      .catch(alert)
      .finally(() => {
        setUiPleaseWait(false);
      });
  }, []);

  /// If user not signed-in with wallet - show prompt
  if (!window.walletConnection.isSignedIn()) {
    // Sign-in flow will reload the page later
    return <SignInPrompt greeting={valueFromBlockchain} />;
  }

  function changeGreeting(hour) {
    const date = new Date();
    date.setUTCHours(hour);
    // e.preventDefault();
    setUiPleaseWait(true);
    // const { greetingInput } = e.target.elements;
    bookBoat(date)
      .then(getBookingsForDay)
      .then(setValueFromBlockchain)
      .catch(alert)
      .finally(() => {
        setUiPleaseWait(false);
      });
  }

  return (
    <>
      <SignOutButton accountId={window.accountId} />
      <main className={uiPleaseWait ? 'please-wait' : ''}>
        <ul>
          {valueFromBlockchain && valueFromBlockchain.map((v, i) =>
            <li key={i}>
              {i + 1}:00 &nbsp;
              {v && <>
                Booked by <a href={`https://wallet.testnet.near.org/profile/${v}`}>{v}</a>
              </>}
              {!v && <>
                <button onClick={() => changeGreeting(i)}>Book</button>
              </>}
            </li>
          )}
        </ul>
        {/* <form onSubmit={() => changeGreeting} className="change">
          <label>Change greeting:</label>
          <div>
            <input
              autoComplete="off"
              defaultValue={valueFromBlockchain}
              id="greetingInput"
            />
            <button>
              <span>Save</span>
              <div className="loader"></div>
            </button>
          </div>
        </form> */}
        {/* <EducationalText /> */}
      </main>
    </>
  );
}
