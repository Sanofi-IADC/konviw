---
title: Introduction
---

<p align="center">
  <a href="https://sanofi-iadc.github.io/konviw/" target="blank"><img :src="$withBase('/konviw.svg')" width="320" alt="Nest Logo" /></a>
</p>

<p align="center">
  Enterprise public viewer for your <a href="https://www.atlassian.com/software/confluence" target="_blank">Confluence</a> pages.
</p>

## Konviw, a Confluence viewer

It comes from the abreviation of Confluence Viewer and the word _conviu_ (coming from Catalan and pronouced /koɱˈviw/) which means coexist en English.

> Konviw is the right companion for your Confluence private cloud instance

## Introduction

Konviw is an open source public viewer for Confluence pages in Enterprise private networks created by Sanofi IADC. We created it to provide an easy way for our end users to read Confluence pages without the clutter of going to Confluence.

### Features

- Simplified REST API providing a read-only access to search pages and retrieve page content
- Page content formated with configurable CSS stylesheets, zoomable images, draw.io diagrams preview, web statisics, reading progress...
- Nicer blog pots with image header, tagline, author and read time estimation
- Slides (thanks to reveal.js) from a Confluence page

### Use cases

- Headless CMS via Confluence
- Corporate blogs
- Cool tech sessions with stunning presentations on the Web

### Roadmap

- [ ] Plugin system
- [x] Comments
- [ ] Dockerized deployment
- [x] Make the 'perf_hooks' measurement optional via .env configuration
- [x] Jira macro renders issues as a table

## Architecture

Konviw implements a proxy http(s) webserver that handle requests to view Confluence pages (NestJS controller) on one hand and resolves them by calling the Confluence content API end-points (NestJS service) and formating them to be visually appealing.

This sequence represents the common steps handled by the proxy server:

1. A user request a Confluence page via the Page ID.
2. The Proxy page service request a new page to the Confluence API service.
3. The Confluence API service calls the Confluence API and expands some fields with special focus on 'body.styled_view' which returns the HTML version of the page.
4. The Proxy page service starts from the initial version of the HTML returned by the API and goes thru a sequence of steps to reformat the page accordingly to our needs.
5. Example of transformations are fixEmojis, fixDrawio, fixExpander... or addCustomCss, addHighlightjs...
6. After all the transformations are applied the HTML page is returned to the user browser.

### Tech Stack

- [Nest.js](https://nestjs.com). A progressive Node.js framework for building efficient, reliable and scalable server-side applications. Guess what, we use NestJS to serve the backend proxy.

<a href="https://nestjs.com/" target="blank"><img :src="$withBase('/nestjs-logo.svg')" width="120" alt="Nest Logo" /></a>

- Simple REST API
- [Cheerio](https://cheerio.js.org) is used to parse the DOM of the HTML returned by the Confluence API and perform the desired transformations.

- [Reveal.js](https://revealjs.com) is our choice to create stunning presentations on the Web from a Confluence page.

<a href="https://revealjs.com" target="blank"><img :src="$withBase('/revealjs-logo.svg')" width="120" alt="Nest Logo" /></a>

- [Zooming](https://github.com/kingdido999/zooming) an image zoom 🔍 that makes sense.
- [Highlight.js](https://highlightjs.org) a JavaScript syntax highlighter with language auto-detection.

## Installation

```bash
$ git clone https://github.com/Sanofi-IADC/konviw.git

$ cd konviw && npm install

$ npm run build

$ npm run start
```

For configuration check the detailed [installation](/installation).

## How to contribute?

[![CI][ci-shield]][ci-url] [![Sonarcloud quality][sonarcloud-shield]][sonarcloud-url] [![MIT License][license-shield]][license-url] [![Gitpod ready-to-code][gp-shield]][gp-url]

- [Create a Bug report](https://github.com/Sanofi-IADC/konviw/issues/new?assignees=&labels=&template=bug_report.md&title=) to help us improve.
- Suggest [feature request](https://github.com/Sanofi-IADC/konviw/issues/new?assignees=&labels=&template=feature_request.md&title=) or idea for this project]
- And if you are interested to contribute to the development or documenation do not hesitate to fork of this repository and propose a pull request with new features.

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

Reveal.js is a MIT-licensed open source HTML presentation framework copyright (C) by Hakim El Hattab, (https://hakim.se). Support the project via [GitHub Sponsors](https://github.com/sponsors/hakimel).

Cheerio is a MIT-licensed open source blazingly fast DOM parser for nodejs servers. Support the project via [GitHub Sponsors](https://github.com/sponsors/cheeriojs)

## License

[MIT licensed](https://github.com/Sanofi-IADC/konviw/blob/main/LICENCE) made by Sanofi IADC

[ci-shield]: https://github.com/Sanofi-IADC/konviw/workflows/CI/badge.svg?branch=main&event=push
[ci-url]: https://github.com/Sanofi-IADC/konviw/actions
[gp-shield]: https://img.shields.io/badge/Gitpod-ready--to--code-blue?logo=gitpod
[gp-url]: https://gitpod.io/#https://github.com/Sanofi-IADC/konviw
[sonarcloud-shield]: https://sonarcloud.io/api/project_badges/measure?project=Sanofi-IADC_konviw&metric=alert_status
[sonarcloud-url]: https://sonarcloud.io/dashboard?id=Sanofi-IADC_konviw
[license-shield]: https://img.shields.io/badge/License-MIT-green.svg
[license-url]: https://github.com/Sanofi-IADC/whispr/blob/master/LICENSE
