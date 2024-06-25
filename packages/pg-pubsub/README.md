# @graphile/pg-pubsub

This PostGraphile [server
plugin](https://www.graphile.org/postgraphile/plugins/) provides a `pubsub`
instance to [schema
plugins](https://www.graphile.org/postgraphile/extending/) that uses
PostgreSQL `LISTEN`/`NOTIFY` to provide realtime features.

Also adds support for `@pgSubscriptions` directive to easily define your own
subscriptions using LISTEN/NOTIFY with `makeExtendSchemaPlugin`; and adds the
`--simple-subscriptions` feature which, when enabled, adds a simple `listen`
subscription field to your GraphQL API.

It's intended that you use this plugin as a provider of realtime data to
other plugins which can use it to add subscription fields to your API.

For full documentation, see: https://www.graphile.org/postgraphile/subscriptions/

<!-- SPONSORS_BEGIN -->

## Crowd-funded open-source software

To help us develop this software sustainably, we ask all individuals and
businesses that use it to help support its ongoing maintenance and development
via sponsorship.

### [Click here to find out more about sponsors and sponsorship.](https://www.graphile.org/sponsor/)

And please give some love to our featured sponsors 🤩:

<table><tr>
<td align="center"><a href="https://www.the-guild.dev/"><img src="https://graphile.org/images/sponsors/theguild.png" width="90" height="90" alt="The Guild" /><br />The Guild</a> *</td>
<td align="center"><a href="https://dovetailapp.com/"><img src="https://graphile.org/images/sponsors/dovetail.png" width="90" height="90" alt="Dovetail" /><br />Dovetail</a> *</td>
<td align="center"><a href="https://stellate.co/"><img src="https://graphile.org/images/sponsors/Stellate.png" width="90" height="90" alt="Stellate" /><br />Stellate</a> *</td>
<td align="center"><a href="https://gosteelhead.com/"><img src="https://graphile.org/images/sponsors/steelhead.svg" width="90" height="90" alt="Steelhead" /><br />Steelhead</a> *</td>
</tr></table>

<em>\* Sponsors the entire Graphile suite</em>

<!-- SPONSORS_END -->

## Usage

CLI:

```
yarn add @graphile/pg-pubsub

postgraphile \
  --plugins @graphile/pg-pubsub \
  --subscriptions \
  --simple-subscriptions \
  -c postgres:///mydb
```

Library:

```js
const express = require("express");
const { postgraphile, makePluginHook } = require("postgraphile");
const { default: PgPubsub } = require("@graphile/pg-pubsub");

const pluginHook = makePluginHook([PgPubsub]);

const postgraphileOptions = {
  pluginHook,
  subscriptions: true, // Enable PostGraphile websocket capabilities
  simpleSubscriptions: true, // Add the `listen` subscription field
  subscriptionEventEmitterMaxListeners: 20, // Set max listeners on eventEmitter, 0 unlimited, 10 default
  websocketMiddlewares: [
    // Add whatever middlewares you need here, note that they should only
    // manipulate properties on req/res, they must not sent response data. e.g.:
    //
    //   require('express-session')(),
    //   require('passport').initialize(),
    //   require('passport').session(),
  ],
};

const app = express();
app.use(postgraphile(databaseUrl, "app_public", postgraphileOptions));
app.listen(parseInt(process.env.PORT, 10) || 3000);
```
