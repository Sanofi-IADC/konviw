<!-- markdownlint-disable MD033 -->

<center>

[![CI][ci-shield]][ci-url]
[![Sonarcloud quality][sonarcloud-shield]][sonarcloud-url]
[![Gitpod ready-to-code][gp-shield]][gp-url]
[![MIT License][license-shield]][license-url]

</center>

<p align="center">
  <a href="https://sanofi-iadc.github.io/konviw/" target="blank"><img src="https://sanofi-iadc.github.io/konviw/images/konviw.svg" width="320" alt="Konviw Logo" /></a>
</p>

  <p align="center">Enterprise public viewer for your <a href="https://www.atlassian.com/software/confluence" target="_blank">Confluence</a> pages.</p>

# Konviw, a Confluence viewer

It comes from the abreviation of Confluence Viewer and the word _conviu_ (coming from Catalan and pronouced /koɱˈviw/) which means coexist en English.

> Konviw is the right companion for your Confluence private cloud instance

## Introduction

Konviw is an open source public viewer for Confluence pages in Enterprise private networks created by Sanofi IADC. We created it to provide an easy way for our end users to read Confluence pages without the clutter of going to Confluence.

## Features

- Simplified REST API providing a read-only access to search pages and retrieve page content
- Page content formated with configurable CSS stylesheets, zoomable images, draw.io diagrams preview, web statisics, reading progress...
- Nicer blog pots with image header, tagline, author and read time estimation
- Slides (thanks to reveal.js) from a Confluence page

## Use cases

- Headless CMS via Confluence
- Corporate blogs
- Cool tech sessions with stunning presentations on the Web

### Roadmap

- [ ] Plugin system
- [x] Comments
- [ ] Dockerized deployment
- [x] Make the 'perf_hooks' measurement optional via .env configuration
- [x] Enhanced configuration of slides functionality with custom themes
- [x] Jira macro renders issues as a table

## Architecture

Konviw implements a proxy http(s) webserver that handle requests to view Confluence pages (NestJS controller) on one hand and resolves them by calling the Confluence content API end-points (NestJS service) and formating them to be visually appealing.

This sequence represents the common steps handled by the proxy server:

1. A user request a Confluence page via the Page ID.
2. The Proxy page service request a new page to the Confluence API service.
3. The Confluence API service calls the Confluence API and expands some fields with special focus on 'body.view' which returns the HTML version of the page.
4. The Proxy page service starts from the initial version of the HTML returned by the API and goes thru a sequence of steps to reformat the page accordingly to our needs.
5. Example of transformations are fixEmojis, fixDrawio, fixExpander... or addCustomCss, addHighlightjs...
6. After all the transformations are applied the HTML page is returned to the user browser.

### Tech Stack

- [Nest.js](https://nestjs.com). A progressive Node.js framework for building efficient, reliable and scalable server-side applications. Guess what, we use NestJS to serve the backend proxy.

- Simple REST API
- [Cheerio](https://cheerio.js.org) is used to parse the DOM of the HTML returned by the Confluence API and perform the desired transformations.

- [Reveal.js](https://revealjs.com) is our choice to create Stunning Presentations on the Web from a Confluence page.

- [Zooming](https://github.com/kingdido999/zooming) an image zoom 🔍 that makes sense.
- [Highlight.js](https://highlightjs.org) a JavaScript syntax highlighter with language auto-detection.

## Installation

```bash
git clone https://github.com/Sanofi-IADC/konviw.git

cd konviw && npm install

npm run build

npm run start
```

For configuration check the [docs](https://sanofi-iadc.github.io/konviw/installation).

## How to contribute?

- [Create a Bug report](https://github.com/Sanofi-IADC/konviw/issues/new?assignees=&labels=&template=bug_report.md&title=) to help us improve.
- Suggest [feature request](https://github.com/Sanofi-IADC/konviw/issues/new?assignees=&labels=&template=feature_request.md&title=) or idea for this project]
- And if you are interested to contribute to the development or documenation do not hesitate to fork of this repository and propose a pull request with new features.

## Support

- [NestJS](https://nestjs.com) is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

- [Cheerio](https://cheerio.js.org) is a MIT-licensed open source blazingly fast DOM parser for nodejs servers. Support the project via [GitHub Sponsors](https://github.com/sponsors/cheeriojs)

- [Reveal.js](https://revealjs.com) is a MIT-licensed open source HTML presentation framework copyright (C) by Hakim El Hattab, (<https://hakim.se>). Support the project via [GitHub Sponsors](https://github.com/sponsors/hakimel).

## Performance

One of the main reasons for building Konviw is performance. A medium complex page in Confluence may take between 6 an 7s to load completely. Of course this is because Confluence is loading all the heavy assets to edit pages, create new content, search, navigate thru the complete page hierarchy of the space... But who wants to wait for 7s when you just want to read the content.

![konviw Lighthouse report](https://konviw.vercel.app/cpv/wiki/download/attachments/35225651/image-20210502-141206.png?version=1&modificationDate=1619964728448&cacheVersion=1&api=v2)

Our objective with konviw is to deliver pages in average below 1 second. Obviously while Atlassian API delivers the content in the current levels of performance so around 500 ms per page.

We will continue to add features but always looking to keep the current levels of performance and speed to deliver beautifully rendered pages. We will not compromise the performance for new features in any case.

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

