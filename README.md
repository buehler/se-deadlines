# SE Deadlines RSS

This repository builds and publishes an RSS feed for software engineering conference deadlines based on the upstream SE Deadlines dataset.

The generator fetches the upstream conference data, keeps deadlines that are still upcoming or at most six months old, and publishes the resulting feed together with this small project page.

RSS feed: [confs.rss](./confs.rss)

## Upstream data

Big thank you to the upstream SE Deadlines project for maintaining the source dataset:

- [se-deadlines/se-deadlines.github.io](https://github.com/se-deadlines/se-deadlines.github.io)
- [conferences.yml](https://raw.githubusercontent.com/se-deadlines/se-deadlines.github.io/refs/heads/main/_data/conferences.yml)
- [types.yml](https://raw.githubusercontent.com/se-deadlines/se-deadlines.github.io/refs/heads/main/_data/types.yml)

This repository only republishes a filtered RSS view of that data.
