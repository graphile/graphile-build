# graphile-build

<span class="badge-patreon"><a href="https://patreon.com/benjie" title="Support Graphile development on Patreon"><img src="https://img.shields.io/badge/sponsor-via%20Patreon-orange.svg" alt="Patreon sponsor button" /></a></span>
[![Discord chat room](https://img.shields.io/discord/489127045289476126.svg)](http://discord.gg/graphile)
[![Package on npm](https://img.shields.io/npm/v/graphile-build.svg?style=flat)](https://www.npmjs.com/package/graphile-build)
![MIT license](https://img.shields.io/npm/l/graphile-build.svg)
[![Follow](https://img.shields.io/badge/twitter-@GraphileHQ-blue.svg)](https://twitter.com/GraphileHQ)

`graphile-build` is the core of Graphile Engine. It provides a framework to
build high-performance extensible GraphQL APIs by combining plugins and using
advanced query look-ahead features. Each plugin typically has its own small
purpose (such as implementing the Node interface, adding `query: Query` to
mutation payloads, or watching an external source for schema changes) and by
combining these plugins together you get a large, powerful, and manageable
GraphQL schema. Plugins enable you to make broad changes to your GraphQL
schema with minimal code and without sacrificing performance.

An example of an application built on `graphile-build` is
[PostGraphile](https://github.com/graphile/postgraphile) which with one
command connects to your PostgreSQL database and provides a full highly
performant standards-compliant GraphQL API. The separate `graphile-build-pg`
module contains the plugins that are specific to PostgreSQL support
(`graphile-build` itself does not know about databases).

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
<td align="center"><a href="https://www.netflix.com/"><img src="https://graphile.org/images/sponsors/Netflix.png" width="90" height="90" alt="Netflix" /><br />Netflix</a> *</td>
<td align="center"><a href="https://stellate.co/"><img src="https://graphile.org/images/sponsors/Stellate.png" width="90" height="90" alt="Stellate" /><br />Stellate</a> *</td>
</tr><tr>
<td align="center"><a href="https://gosteelhead.com/"><img src="https://graphile.org/images/sponsors/steelhead.svg" width="90" height="90" alt="Steelhead" /><br />Steelhead</a> *</td>
<td align="center"><a href="https://www.sylvera.com/"><img src="https://graphile.org/images/sponsors/sylvera.svg" width="90" height="90" alt="Sylvera" /><br />Sylvera</a> *</td>
</tr></table>

<em>\* Sponsors the entire Graphile suite</em>

<!-- SPONSORS_END -->

## Documentation

**For in-depth documentation about `graphile-build`, please see [the graphile
documentation website at graphile.org](https://www.graphile.org/).** The
below just serves as a limited quick-reference for people already familiar
with the library.

**Please note: rather than using the raw plugin interface that
`graphile-build` exposes, you may want to use the helpers in
the `graphile-utils` module.**
