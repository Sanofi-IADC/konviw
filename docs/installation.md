---
title: Installation
---

## Manual setup

```bash
➜ git clone https://github.com/Sanofi-IADC/konviw.git

➜ cd konviw && npm install

➜ npm run build

➜ npm run start
```

## Docker setup

- [ ] TODO

## Configuration

Configuration is made with environment variables. They can also be defined with the `.env` file when running locally. Check the `.env.example` for an example of environment file.

- `NODE_ENV`: `development`, `test` or `production`. Default: `production`
- `CPV_BASEPATH`: the base path where the app is exposed. Useful when exposed behind a reverse proxy. Used to generate links. Default: `/` (but defined as `/cpv` in production)
- `CPV_BASEHOST`: the domain URL to compose full URL to resolve images and links from the API, like https://www.example.com. **Required**
- `CPV_CONFLUENCE_BASE_URL`: Confluence server base URL. **Required**
- `CPV_CONFLUENCE_API_USERNAME`: Confluence API username (usually an email address). **Required**
- `CPV_CONFLUENCE_API_TOKEN`: Confluence API token (can be created [here](https://id.atlassian.com/manage/api-tokens)). **Required**
- `CPV_KONVIW_PRIVATE_PAGE`: A label to tag pages as private. **Required**
- `CPV_GOOGLE_ANALYTICS`: Tag for tracking web analytics vis Google Analytics. _Optional_

If you have multiple Jira instances connected to your Confluence server you can provide the URL and access credentials so konviw will render properly the Jira Issues/Filter macros for each respective server:

- `CPV_JIRA_System_JIRA_BASE_URL`: Jira server base URL. _Optional_
- `CPV_JIRA_System_JIRA_API_USERNAME`: Jira API username (usually an email address). _Optional_
- `CPV_JIRA_System_JIRA_API_TOKEN`: Jira API token. _Optional_
- `CPV_JIRA_Other_JIRA_BASE_URL`: Jira server base URL. _Optional_
- `CPV_JIRA_Other_JIRA_API_USERNAME`: Jira API username (usually an email address). _Optional_
- `CPV_JIRA_Other_JIRA_API_TOKEN`: Jira API token. _Optional_

Credentials for Jira and Confluence servers may be the same if the username has enought rights to access to all the servers.

## Development

1. Clone the repo:

```bash
➜ git clone https://github.com/Sanofi-IADC/konviw.git
```

2. Install packages:

```bash
➜ cd konviw && npm install
```

3. Create an Atlassian API token: https://id.atlassian.com/manage/api-tokens

4. Copy `.env.example` to `.env` and edit your configuration.

5. Run the server in watch mode:

```bash
➜ npm run start:dev
```

6. You can use the proxy on `http://localhost:3000/`

## Documentation

We use [VuePress](https://vuepress.vuejs.org/) to maintain and publish the konviw online documentation.
Check them locally with

```bash
➜ npm run docs:dev
```

and deploy them in Github pages with

```bash
➜ npm run docs:deploy
```

## Advance Customizing

You can furher customize the way the pages are rendered and the default styles applying your own stylesheets.

In the folder `src/assets/scss` you will find all the scss stylesheets organized by formating group.

For instance editing the file `expander-panel.scss` you can personalize the style for your expander panels. Whether you prefer arrows instead of `+` / `-` symbols or change text size or color.

```js
// Expander pannel ========================================
div.expand-container {
  border-radius: 10px;
  border: solid 1px var(--border-expander);
  margin-top: 10px;
  margin-bottom: 10px;
  padding: 5px;
  background-color: var(--bg-expander);
}
div.expand-control:before {
  content: "\2795"; // symbol +
}
div.active:before {
  content: "\2796"; // symbol -
}
div.expand-control {
  cursor: pointer;
  padding: 10px;
  font-size: 20px;
  font-weight: 400;
}
div.expand-control:hover {
  background-color: var(--border-expander);
  border-radius: 10px;
}
span.expand-control-text {
  padding: 5px;
  word-wrap: break-word;
  white-space: normal;
}
div.expand-content {
  transition: max-height 0.3s ease-out;
  font-size: 18px;
  padding: 0 18px;
  max-height: 0;
  overflow: hidden;
}
```

As you see we use CSS variables for the most common styles shared across components. You can access and modify all those variables from the file `variables.scss`.
