'use strict';

const enablebanking = require('enablebanking');
const fetch = require('node-fetch');

/**
 * Bank connector specific settings
 */
const nordeaSettings = [
  true, // sandbox
  null, // consentId
  null, // accessToken
  "!!! CLIENT ID TO BE INSERTED HERE !!!", // clientId
  "!!! CLIENT SECRET TO BE INSERTED HERE !!!", // clientSecret
  "/path/to/a/qwac/cert.cer", // certPath
  "/path/to/a/qseal/signature/key.pem", // keyPath
  "FI", // country
  1000, // sessionDuration
  null, // language
  "https://enablebanking.com/" // redirectUri
];

function getResponseCode(url) {
  var qs = url.split('?')[1];
  var pairs = qs.split('&');
  for (var i = 0; i < pairs.length; i++) {
    var key_value = pairs[i].split('=');
    if (key_value[0] === 'code') {
      return key_value[1];
    }
  }
};

async function main() {
  const apiClient = new enablebanking.ApiClient('Nordea', nordeaSettings);
  const authApi = new enablebanking.AuthApi(apiClient);
  const getAuthResult = await authApi.getAuth(
    {
      state: 'test'
    }
  );
  // follow the url to make user authorization
  // usually you need to do a few clicks in the UI
  const authResult = await fetch(getAuthResult.url);
  const responseCode = getResponseCode(authResult.url);
  // token is returned and also saved inside `apiClient`
  const makeTokenResponse = await authApi.makeToken(
    'authorization_code',
    responseCode
  );
  const aispApi = new enablebanking.AISPApi(apiClient);
  const accounts = await aispApi.getAccounts();
  console.log(accounts);
  const accountId = accounts.accounts[0].resourceId;
  const accountTransactions = await aispApi.getAccountTransactions(accountId);
  console.log(accountTransactions)
};

main().then(function() {
  console.log("All done!");
});