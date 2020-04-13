'use strict';

const enablebanking = require('enablebanking');
const readline = require('readline');

/**
 * Helper function for reading a single line from stdin
 */
async function readLine(msg) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  console.log(msg);
  for await (const line of rl) {
    return line;
  }
}

/**
 * Bank connector specific settings
 */
const settings = {
  'Nordea': {
    sandbox: true,
    consentId: null,
    accessToken: null,
    redirectUri: 'https://enablebanking.com/auth_redirect',
    country: null, // to be set when country is chosen
    clientId: '!!! CLIENT ID TO BE INSERTED HERE !!!',
    clientSecret: '!!! CLIENT SECRET TO BE INSERTED HERE !!!',
    clientSecret: 'path/to/signature/key.pem',
    sessionDuration: 1000,
    language: null
  },
  'Swedbank': {
    sandbox: true,
    consentId: null,
    accessToken: null,
    redirectUri: 'https://enablebanking.com/auth_redirect',
    country: null, // to be set when country is chosen
    clientId: '!!! CLIENT ID TO BE INSERTED HERE !!!',
    clientSecret: '!!! CLIENT SECRET TO BE INSERTED HERE !!!'
  }
  // More settings to be put here
};

/**
 * Bank connector specific settings
 */
async function main() {
  // Reading coutry code from console
  var country = await readLine('Please enter ISO country code (e.g., SE):');
  country = country.trim().toUpperCase();
  // Initializing meta API
  const metaApi = new enablebanking.MetaApi();
  // Getting list of available connectors for the chosen country
  const getConnectorsResult = await metaApi.getConnectors({ country: country });
  if (!getConnectorsResult.connectors.length) {
    console.log('No connectors available');
    return;
  }
  console.log('Available connectors:')
  getConnectorsResult.connectors.forEach(function(connector, index) {
    console.log(index, connector.name);
  });
  const connectorIndex = await readLine('Please enter connector index to choose:')
  const connector = getConnectorsResult.connectors[parseInt(connectorIndex)];
  if (connector === undefined) {
    console.log('Wrong connector index');
    return;
  }
  // Saving authentication meta (will be used later)
  const authMeta = connector.authInfo[0].info;
  const connectorSettings = settings[connector.name];
  if (connectorSettings === undefined) {
    console.log('No settings for the chosen connector');
    return;
  }
  // Overriding country in the settings (but only if it's present)
  if (connectorSettings.country !== undefined) {
    connectorSettings.country = country;
  }
  // Initializing ApiClient for the chosen bank
  const apiClient = new enablebanking.ApiClient(
    connector.name,
    // passing only values (this is why the order matters for the settings)
    Object.values(connectorSettings));
  // Initializing authentication interface
  const authApi = new enablebanking.AuthApi(apiClient);
  // Setting user client information
  await authApi.setClientInfo({
    clientInfo: {
      psuIpAddress: '10.10.10.10',
      psuUserAgent: 'Mozilla'
      // more parameters might be needed for some banks, so it's recommended to
      // fill in all.
    }
  })
  // Reading user ID in case it's required for user authentication
  if (authMeta.userIdRequired) {
    var userId = await readLine(
      'Please enter user id (for sandboxes consult with the bank developer documentation):')
  }
  // Setting access validity for 2 days
  const accessValidUntil = new Date();
  accessValidUntil.setDate(accessValidUntil.getDate() + 2);
  // Declaring base access scope
  const access = new enablebanking.Access({
    recurringIndicator: false,
    validUntil: accessValidUntil
  })
  const getAuthResult = await authApi.getAuth({
    state: 'test',
    userId: userId,
    access: access // will be ignored by the connectors where not used
  });
  var authorizationCode = '';
  if (getAuthResult.url) {
    console.log(
      'Follow the URL to make user authorization '
        + '(usually you need to do a few clicks in the UI):\n'
        + getAuthResult.url
    )
    const redirectUrl = await readLine('Please enter the URL you were redirected to:');
    // Parsing redirect url using special Auth API method (connector specific)
    const parseRedirectUrlResult = await authApi.parseRedirectUrl(redirectUrl);
    authorizationCode = parseRedirectUrlResult.code;
  } else {
    console.log(
      'Decoupled authentication flow is used. '
        + 'In sandbox environment authentication is likely to be omitted. '
        + 'Please consult with the documentation for the chosen connector.'
    )
  }
  // Requesting user access token
  const makeTokenResponse = await authApi.makeToken(
    'authorization_code',
    authorizationCode,
    { authEnv: getAuthResult.env }
  );
  console.log('User access token received:', makeTokenResponse.access_token);
  // Initializing AISP interface. Normally in order to use AISP interface ApiClient needs
  // to be initialized with accessToken, but here we are re-using existing ApiClient instance as
  // the token is preserved inside it.
  const aispApi = new enablebanking.AISPApi(apiClient);
  var needAccountAccess = false;
  // Need to call modifyConsents before getting account information
  if (!authMeta.access) {
    const modifyConsentsResult = await aispApi.modifyConsents({
      access: access
    });
    console.log('User consent id:', modifyConsentsResult.consentId);
    if (modifyConsentsResult._links.redirect) {
      console.log(
        'Follow the URL to confirm the consent: '
          + modifyConsentsResult._links.redirect.href);
      await readLine('Press ENTER after the consent is given');
    } else {
      // FIXME: this needs to be formalized
      needAccountAccess = true;
    }
  }
  // Getting list of user's bank accounts
  const getAccountsResult = await aispApi.getAccounts();
  console.log(getAccountsResult.accounts.length + ' account(s) available:');
  getAccountsResult.accounts.forEach(function(account, index) {
    console.log(index, account.accountId);
  });
  const accountIndex = await readLine('Please enter account index to choose:');
  const account = getAccountsResult.accounts[parseInt(accountIndex.trim())];
  if (account === undefined) {
    console.log('Wrong account index');
    return;
  }
  if (needAccountAccess) {
    // FIXME: duplicated code to be unified
    const modifyConsentsResultForAccount = await aispApi.modifyConsents({
      access: new enablebanking.Access({
        accounts: [account.accountId],
        validUntil: accessValidUntil
      })
    });
    console.log('User consent id:', modifyConsentsResultForAccount.consentId);
    if (modifyConsentsResultForAccount._links.redirect) {
      console.log(
        'Follow the URL to confirm the consent: '
          + modifyConsentsResultForAccount._links.redirect.href);
      await readLine('Press ENTER after the consent is given');
    }
  }
  // Getting list of account transactions
  const getAccountTransactionsResult = await aispApi.getAccountTransactions(account.resourceId);
  console.log(getAccountTransactionsResult.transactions.length + ' transaction(s) received:');
  getAccountTransactionsResult.transactions.forEach(function(transaction, index) {
    console.log(index, transaction);
  });
};

main().then(function() {
  process.exit(0);
}).catch(function(e) {
  console.error(e);
  process.exit(1);
});
