| :warning: Deprecation Notice |
|-----------------------------|
| This repository is deprecated and is no longer maintained.  |
| Please refer to the [documentation](https://enablebanking.com/docs/) for the relevant information. | 
| It is advised to use [Enable Banking API](https://enablebanking.com/docs/api/reference/) for Open Banking integrations |

# OpenBankingJSExamples

Sample JavaScript code showing how to use Open banking APIs (PSD2 AISP &amp; PISP) using
[enable:Banking JS library](https://enablebanking.com/docs/sdk?javascript).

This repository contains 2 independent code samples:

- [aispdemo](/aispdemo) - retrieving account information (user authentication & consent for account information -> list of
accounts -> list of transactions)
- [pispdemo](/pispdemo) - authenticating user and getting account information consent, retrieving list of account and
transferring money from one account to the other own account (payment confirmation is done using bank's web UI)

# AISP demo

The code contains sample settings for [Nordea](https://enablebanking.com/docs/sdk/latest/#nordeaconnectorsettings-type) and
[Swedbank](https://enablebanking.com/docs/sdk/latest/#swedbankconnectorsettings-type) sandbox connectors, but can be used with
the other connectors as well. In order to run the sample code you need to obtain own sandbox credentials; for the instructions
please refer to the [connectors documentation](https://enablebanking.com/docs/sdk/latest/#connectors-types).

# PISP demo

The code uses `SPankki` connector and gets access to [S-Pankki](https://www.s-pankki.fi/)'s open banking sandbox. In order to
run the demo you need to use own credentials (including test eIDAS certificates), which can be obtained after signing up to
[Crosskey Open Banking Market](https://crosskey.io/) (Crosskey is the vendor of open banking APIs for S-Pankki).

----

**Please note** that enablebanking is not open-source software and is **not available in general 
[npm repository](https://www.npmjs.com/)**, so please contact us at [hello@enablebanking.com](mailto:hello@enablebanking.com)
if you want to use it.
