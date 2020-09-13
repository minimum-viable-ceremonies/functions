# Minimum Viable Marketing

A collection of [firebase functions](https://firebase.google.com/docs/functions) to be used as a backend for the [Minimum Viable Ceremonies](https://github.com/minimum-viable-ceremonies/app) app.

###  🔧 **Developing.**

```shell
cd functions
npm run serve
```

In order for the Sendgrid lambdas to work correctly, the following firebase config variables will need to be populated:
```shell
firebase functions:config:set \
  sendgrid.api_key (api key with write access to contact lists) \
  sendgrid.list_id (id of sendgrid contact list to interact with) \
  sendgrid.cors_origin (domain which will be querying this API)
```

To clone the environment variables from firebase for local dev,
```shell
firebase functions:config:get > .runtimeconfig.json   
```

### 💫 **Deploying.**

Pushing to the master branch of this repo will automatically publish to Firebase. Instructions on invoking functions from the app can be found [here](https://firebase.google.com/docs/functions/callable)
