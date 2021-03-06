'use strict';

const readline = require('readline');
const url = require('url');

const enablebanking = require('enablebanking');

/**
 * Helper function for reading one line from stdin
 */
async function readLine() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  return new Promise((res, rej) => {
    rl.on('line', (line) => { rl.close(); res(line) }); });
};

/**
 * Bank connector specific settings
 */
const spankkiSettings = {
  sandbox: true,
  consentId: null,
  accessToken: null,
  clientId: "!!! CLIENT ID TO BE INSERTED HERE !!!",
  xApiKey: "!!! X API KEY TO BE INSERTED HERE !!!",
  certPath: "wac.crt", // path to QWAC certificate
  keyPath: "wac.key", // path to QWAC private key
  signKeyPath: "seal.key", // path to Qseal private key
  signPubKeySerial: "!!! QSEAL KID TO BE INSERTED HERE !!!", // Qseal kid
  paymentAuthRedirectUri: "https://enablebanking.com/",
  redirectUri: "https://enablebanking.com/",
  paymentAuthState: null
};

const apiClient = new enablebanking.ApiClient('SPankki', spankkiSettings);
const authApi = new enablebanking.AuthApi(apiClient);
const aispApi = new enablebanking.AISPApi(apiClient);
const pispApi = new enablebanking.PISPApi(apiClient);

async function main() {
  const auth = await authApi.getAuth(
    { state: "test" }
  );
  console.log("Authentication URL:", auth.url);
  console.log("Please enter URL where you've been redirected to after authentication:");
  const redirect = await readLine();
  const redirectURL = url.parse(redirect.replace("#", "?") /* because code in hash */, true);
  const token = await authApi.makeToken(
    "authorization_code",
    redirectURL.query.code
  );
  console.log("Bearer access token:", token.access_token);

  const halAccounts = await aispApi.getAccounts();

  console.log("Making payment request from account", halAccounts.accounts[0].accountId.iban);
  const paymentRequest = {
    debtorAccount: {
      iban: halAccounts.accounts[0].accountId.iban // transferring money from this account
    },
    creditTransferTransaction: [{
      instructedAmount: {
        currency: 'EUR',
        amount: '12.3'
      },
      beneficiary: {
        creditor: {
          name: 'Creditor Name'
        },
        creditorAccount: {
          iban: halAccounts.accounts[1].accountId.iban // to own account
        },
      },
      remittanceInformation: ["Some message"]
    }]
  };
  const halPRCreation = await pispApi.makePaymentRequest(paymentRequest);
  console.log("Payment request id:", halPRCreation.paymentRequestResourceId);
  console.log(
    "Payment request authentication approach:",
    halPRCreation.appliedAuthenticationApproach);
  console.log("Payment authorization URL:", halPRCreation._links.consentApproval.href);
  console.log("Please enter URL where you've been redirected to after authorization:");
  const paymentRedirect = await readLine();
  const paymentRedirectURL = url.parse(
    paymentRedirect.replace("#", "?") /* because code in hash */, true);
  const halPR = await pispApi.makePaymentRequestConfirmation(
    halPRCreation.paymentRequestResourceId,
    {
      confirmation: {
        psuAuthenticationFactor: paymentRedirectURL.query.code
      }
    });
  console.log("Payment request data:", halPR);
};

main().then(function() {
  console.log("All done!");
});
