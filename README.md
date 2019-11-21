# OpenBankingJSExamples

Sample JavaScript code showing how to use Open banking APIs (PSD2 AISP &amp; PISP) using
[enable:Banking JS library](https://enablebanking.com/docs/sdk?javascript).

This repository contains 2 independent code samples:

- [aispdemo](/aispdemo) - retrieving account information (list of accounts, accounts' balances and transactions) using
existing consent ID
- [pispdemo](/pispdemo) - authenticating user and getting account information consent, retrieving list of account and
transferring money from one account to the other own account (payment confirmation is done using bank's web UI)

# AISP demo

The code uses `Nordea` connector and gets access to [Nordea](https://www.nordea.fi/)'s open banking sandbox. In order to run
the demo you need to use own credentials, which can be obtained after signing up to
[Nordea's Developer Portal](https://developer.nordeaopenbanking.com/).

# PISP demo

The code uses `SPankki` connector and gets access to [S-Pankki](https://www.s-pankki.fi/)'s open banking sandbox. In order to
run the demo you need to use own credentials (including test eIDAS certificates), which can be obtained after signing up to
[Crosskey Open Banking Market](https://crosskey.io/) (Crosskey is the vendor of open banking APIs for S-Pankki).

----

**Please note** that enablebanking is not open-source software and is **not available in general 
[npm repository](https://www.npmjs.com/)**, so please contact us at [hello@enablebanking.com](mailto:hello@enablebanking.com)
if you want to use it.
