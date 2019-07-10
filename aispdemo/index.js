'use strict';

const enablebanking = require('enablebanking');

const aktiaSettings = [
  true, // sandbox
  "!!! CLIENT ID TO BE INSERTED HERE !!!", // clientId
  "!!! CLIENT SECRET TO BE INSERTED HERE !!!", // clientSecret
  null, // accessToken
  "12345-1232-123", // consentId
  "https://enablebanking.com/consent-redirect-callback" // tppRedirectUri
];
const apiClient = new enablebanking.ApiClient('Aktia', aktiaSettings);
const aispApi = new enablebanking.AISPApi(apiClient);

async function main() {
  // Authentication and consent creation are omitted as consent ID is passed to the
  // API client constructor.
  console.log("Retrieving list of accounts...");
  const halAccounts = await aispApi.getAccounts();
  console.log("Accounts info:", halAccounts);
  for (let account of halAccounts.accounts) {
    console.log("Retrieving account balances...");
    let halBalances = await aispApi.getAccountBalances(account.resourceId);
    console.log("Balances info:", halBalances);
    console.log("Retrieving account transactions...");
    let halTransactions = await aispApi.getAccountTransactions(account.resourceId);
    console.log("Transactions:");
    for (let transaction of halTransactions.transactions) {
      console.log(
        "- Status:",
        transaction.status);
      console.log(
        "  Credit/debit:",
        transaction.creditDebitIndicator);
      console.log(
        "  Amount:",
        transaction.transactionAmount.amount,
        transaction.transactionAmount.currency);
    }
  }
};

main().then(function() {
  console.log("All done!");
});
