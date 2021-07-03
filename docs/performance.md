---
title: Performance
---

<!-- markdownlint-disable MD033 -->

One of the main reasons for building Konviw is performance. A medium complex page in Confluence may take between 6 an 7s to load completely. Of course this is because Confluence is loading all the heavy assets to edit pages, create new content, search, navigate thru the complete page hierarchy of the space... But who wants to wait for 7s when you just want to read the content.

This is an example of the Lighthouse performance report on the [demo Styles](demoStyles) page.

![Confluence Lighthouse report](https://konviw.vercel.app/cpv/wiki/download/attachments/35225651/image-20210502-140806.png?version=1&modificationDate=1619964489513&cacheVersion=1&api=v2)

Running the Lighthouse performance on the same page rendered by konviw…
Wow, this is much better!

And of course this is for a page with many images and assets we can’t touch and improve with konviw. If we run Lighthouse in a page with fewer images, yep, even better. And those tests are run disabling the cache of the browser and the NestJS cache (with parameter cache=no-cache).

![konviw Lighthouse report](https://konviw.vercel.app/cpv/wiki/download/attachments/35225651/image-20210502-141206.png?version=1&modificationDate=1619964728448&cacheVersion=1&api=v2)

Our objective with konviw is to deliver pages in average below 1 second. Obviously while Atlassian API delivers the content in the current levels of performance so around 500 ms per page.

We will continue to add features but always looking to keep the current levels of performance and speed to deliver beautifully rendered pages. We will not compromise the performance for new features in any case.
