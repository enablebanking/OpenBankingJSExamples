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
 * Helper function for waiting a given number of seconds
 */
async function sleep(s) {
  return new Promise(res => setTimeout(res, s * 1000));
};

const nordeaSettings = [
  true, // sandbox
  "!!! CLIENT ID TO BE INSERTED HERE !!!", // clientId
  "!!! CLIENT SECRET TO BE INSERTED HERE !!!", // clientSecret
  "cert.cer", // certPath
  "key.pem", // keyPath
  "1111", // keyPassword
  "FI", // country
  null, // accessToken
  1000, // sessionDuration
  null // language
];
const apiClient = new enablebanking.ApiClient('Nordea', nordeaSettings);
const authApi = new enablebanking.AuthApi(apiClient);
const aispApi = new enablebanking.AISPApi(apiClient);
const pispApi = new enablebanking.PISPApi(apiClient);

async function main() {
  const auth = await authApi.getAuth(
    "code",
    "https://enablebanking.com/",
    ["aisp", "pisp"],
    { state: "test" }
  );
  console.log("Authentication URL:", auth.url);

  console.log("Please enter URL where you've been redirected to after authentication:");
  const redirect = await readLine();
  const redirectURL = url.parse(redirect, true);
  const token = await authApi.makeToken(
    "authorization_code",
    redirectURL.query.code,
    { redirectUri: 'https://enablebanking.com/' }
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
  console.log("Waiting 10 seconds for payment approval...");
  await sleep(10); // Nordea sandbox should automatically approve payment requests in 10 sec
  const halPR = await pispApi.makePaymentRequestConfirmation(
    halPRCreation.paymentRequestResourceId);
  console.log("Payment request data:", halPR);
};

main().then(function() {
  console.log("All done!");
});
