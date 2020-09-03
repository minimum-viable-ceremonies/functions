# Minimum Viable Marketing

A collection of [firebase functions](https://firebase.google.com/docs/functions) to be used as a backend for the [Minimum Viable Ceremonies](https://github.com/minimum-viable-ceremonies/app) app.

###  🔧 **Developing.**

```shell
cd functions
npm run serve
```

In order for the Sendgrid lambdas to work correctly, the following ENV variables will need to be populated:
```
SENDGRID_API_KEY <api key with read/write access to contact lists>
SENDGRID_LIST_ID <contact list to interact with>
SENDGRID_CORS_ORIGIN <origin of site that will be calling this API>
```

### 💫 **Deploying.**

Pushing to the master branch of this repo will automatically publish to Firebase. Instructions on invoking functions from the app can be found [here](https://firebase.google.com/docs/functions/callable)
