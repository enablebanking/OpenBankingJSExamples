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
  "https://enablebanking.com/auth_redirect",  // redirectUri
  "FI", // country
  "!!! CLIENT ID TO BE INSERTED HERE !!!", // clientId
  "!!! CLIENT SECRET TO BE INSERTED HERE !!!", // clientSecret
  "path/to/signature/key.pem", // signKeyPath
  1000, // sessionDuration
  null, // language
];

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
  const responseCode = (await authApi.parseRedirectUrl(authResult.url)).code;
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
  console.log(accountTransactions);
};

main().then(function() {
  console.log("All done!");
  process.exit(0);
}).catch(function(e) {
  console.error(e);
  process.exit(1);
});
