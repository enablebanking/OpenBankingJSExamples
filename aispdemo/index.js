'use strict';

const enablebanking = require('enablebanking');

/**
 * Bank connector specific settings
 */
const kirSettings = [
  true, // sandbox
  null, // consentId
  null, // accessToken
  null, // refreshToken
  "PSDPL-KNF-1234567890", // clientId
  "assets/KIR/qwac.crt", // certPath
  "assets/KIR/key.key", // keyPath
  "assets/KIR/key.key", // signKeyPath
  "667fc34ec1f04c8f80827ad5f87cffa675b0ad94", // signSubjectKeyIdentifier
  "1s4POi24Ou0Ew4pLCxvYSd5U62Gz7pGhcwbyXKYhZig", // signFingerprint
  "https://enablebanking.com/eb-kir-qseal.crt", // signCertUrl
  "https://enablebanking.com/", // paymentAuthRedirectUri
  null // paymentAuthState
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
  const apiClient = new enablebanking.ApiClient('KIR', kirSettings);
  const authApi = new enablebanking.AuthApi(apiClient);
  const getAuthResult = await authApi.getAuth(
    'code',
    'https://enablebanking.com',
    ['aisp'],
    {
      state: 'test'
    }
  );
  console.log("Open the URL to make authorization: " + getAuthResult.url);
  const authResultUrl = "redirected url here?code=xxxxxx";
  const responseCode = getResponseCode(authResultUrl);
  // token is returned and also saved inside `apiClient`
  const makeTokenResponse = await authApi.makeToken(
    'authorization_code',
    responseCode,
    {
      redirectUri: 'https://enablebanking.com'
    }
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
