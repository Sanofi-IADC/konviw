---
title: Installation
---

# Installation

## Manual setup

```bash
$ git clone https://github.com/Sanofi-IADC/konviw.git

$ cd konviw && npm install

$ npm run build

$ npm run start
```

## Setup with Docker

- [ ] TODO

## Configuration

Configuration is made with environment variables. They can also be defined with the `.env` file when running locally. Check the `.env.example` for an example of environment file.

- `NODE_ENV`: `development`, `test` or `production`. Default: `production`
- `CPV_BASEPATH`: the base path where the app is exposed. Useful when exposed behind a reverse proxy. Used to generate links. Default: `/` (but defined as `/cpv` in production)
- `CPV_BASEHOST`: the domain URL to compose full URL to resolve images and links from the API, like https://www.example.com. **Required**
- `CPV_CONFLUENCE_BASE_URL`: Confluence server base URL. **Required**
- `CPV_CONFLUENCE_API_USERNAME`: Confluence API username (usually an email address). **Required**
- `CPV_CONFLUENCE_API_TOKEN`: Confluence API token (can be created [here](https://id.atlassian.com/manage/api-tokens)). **Required**
- `CPV_MATOMO_BASE_URL`: Matomo server base URL. _Optional_
- `CPV_MATOMO_ID_SITE`: Id of the Confluence public viewer site in Matomo. _Optional_

## Development

1. Clone the repo:

```bash
$ git clone https://github.com/Sanofi-IADC/konviw.git
```

2. Install packages:

```bash
$ cd konviw && npm install
```

3. Create an Atlassian API token: https://id.atlassian.com/manage/api-tokens

4. Copy `.env.example` to `.env` and edit your configuration.

5. Run the server in watch mode:

```bash
$ npm run start:dev
```

6. You can use the proxy on `http://localhost:3000/`

## Test

- [ ] TODO
