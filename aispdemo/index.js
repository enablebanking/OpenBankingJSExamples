'use strict';

const enablebanking = require('enablebanking');
const readline = require('readline');


const REDIRECT_URL = "https://enablebanking.com/auth_redirect"  // PUT YOUR REDIRECT URI HERE
const CONNECTOR_NAME = "Nordea"
const CONNECTOR_COUNTRY = "FI"
/**
 * Bank connector specific settings
 */
const CONNECTOR_SETTINGS = {
  sandbox: true,
  consentId: null,
  accessToken: null,
  redirectUri: REDIRECT_URL,
  country: CONNECTOR_COUNTRY,
  business: null,
  clientId: "client_id",  // API Client ID
  clientSecret: "client_secret",  // API Client Secret
  signKeyPath: "/path/to/private.key",  // Path or URI to QSeal private key in PEM format
  language: null,
  paymentAuthRedirectUri: REDIRECT_URL,
  paymentAuthState: "test",
}

const readRedirectUrl = async (url, redirectUrl) => {
  console.log(`Please, open this page in browser: ${url}`)
  console.log("Log in, authenticate and copy/paste back the URL where you got redirected.")
  return input(`URL (starts with ${redirectUrl}): `)
}

const input = async (query) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise(resolve => rl.question(query, ans => {
    rl.close();
    resolve(ans);
  }))
}

function sleep(seconds) {
  return new Promise(resolve => setTimeout(resolve, seconds * 1000));
}

const getConnectorMeta = async (connectorName, connectorCountry) => {
  const metaApi = new enablebanking.MetaApi(enablebanking.ApiClient())
  for (const conn of (await metaApi.getConnectors({ country: connectorCountry })).connectors) {
    if (conn.name == connectorName) {
      return conn
    }
  }
  throw new Error("Meta not found")
};

async function main() {
  const apiMeta = await getConnectorMeta(CONNECTOR_NAME, CONNECTOR_COUNTRY);
  const apiClient = new enablebanking.ApiClient(CONNECTOR_NAME, CONNECTOR_SETTINGS);
  const authApi = new enablebanking.AuthApi(apiClient);
  const clientInfo = new enablebanking.ClientInfo();
  const connectorPsuHeaders = apiMeta.requiredPsuHeaders;
  if (connectorPsuHeaders.includes('psuIpAddress')) {
    clientInfo.psuIpAddress = '10.10.10.10'
  }
  if (connectorPsuHeaders.includes('psuUserAgent')) {
    clientInfo.psuUserAgent = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/12.1.1 Safari/605.1.15'
  }
  await authApi.setClientInfo({ clientInfo: clientInfo })

  const validUntil = new Date()
  const days = 89
  validUntil.setDate(validUntil.getDate() + days)
  const access = new enablebanking.Access({
    validUntil: validUntil
  });

  const getAuthParams = { state: "test" }
  if (apiMeta.authInfo[0].info.access) {
    getAuthParams.access = access
  }
  if (apiMeta.authInfo[0].info.credentials) {
    const credentials = [];
    for (const cred of apiMeta.authInfo[0].info.credentials) {
      credentials.push(await input(`Please enter ${cred.title}:`)) // obtain data in `cred` and push appropriate credential
    }
    getAuthParams.credentials = credentials;
  }
  const authResponse = await authApi.getAuth(getAuthParams)

  let makeTokenResponse
  if (authResponse.url) {
    // if url is returned, then we are doing redirect flow
    const redirectedUrl = await readRedirectUrl(authResponse.url, REDIRECT_URL)
    const queryParams = await authApi.parseRedirectUrl(redirectedUrl)
    console.log(`Parsed query: ${queryParams}`)
    makeTokenResponse = await authApi.makeToken(
      "authorization_code",
      queryParams.code,
      { authEnv: authResponse.env }
    )
  } else {
    // decoupled flow
    // Doing a retry to check periodically whether user has already authorized a consent
    const sleepTime = 3
    for (let i = 0; i < 10; i++) {
      try {
        makeTokenResponse = await authApi.makeToken(
          "authorization_code",
          "",
          { authEnv: authResponse.env }
        )
        break
      } catch (err) {
        if (err instanceof enablebanking.errors.MakeTokenError) {
          if (err.retry) {
            console.log(`Not ready, retrying in ${sleepTime} seconds`)
            await sleep(sleepTime)
            continue
          }
        }
        console.error(err)
        throw err
      }
    }
  }

  console.log(`Token is: ${makeTokenResponse}`)

  // apiClient has already accessToken and refreshTOken applied after call to makeToken()
  const aispApi = new enablebanking.AISPApi(apiClient)
  if (apiMeta.modifyConsentsInfo[0].info.beforeAccounts) {
    const consent = await aispApi.modifyConsents({ access: access })
    console.log(`Consent: ${consent}`);
    try {
      const consentUrl = consent._links.redirect.href;
      const redirectUrl = await readRedirectUrl(consentUrl, REDIRECT_URL)
      console.log(`Redirect url: ${redirectUrl}`);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  const accounts = await aispApi.getAccounts();
  console.log(accounts);

  if (apiMeta.modifyConsentsInfo[0].info.accountsRequired) {
    const accountIds = getAccountsResult.accounts.map((el) => new enablebanking.AccountIdentification({ iban: el.accountId.iban }));
    access.accounts = accountIds;
    const consent = await aispApi.modifyConsents({ access: access })
    console.log(`Consent: ${consent}`);
    try {
      const consentUrl = consent._links.redirect.href;
      const redirectUrl = await readRedirectUrl(consentUrl, REDIRECT_URL)
      console.log(`Redirect url: ${redirectUrl}`);
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
  for (const account of accounts.accounts) {
    let transactions = await aispApi.getAccountTransactions(account.resourceId)
    console.log(`Transactions info: ${transactions}`)
    let balances = await aispApi.getAccountTransactions(account.resourceId)
    console.log(`Balances info: ${balances}`)
  }
};

main().then(function () {
  console.log("All done!")
});
