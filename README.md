# tatr-ql
tatr-ql is a Node.js reimplementation of [tsoding/tatr](https://github.com/tsoding/tatr), a Task Tracker Query Language created by [Tsoding](https://github.com/tsoding).

The original project is implemented in C/C++. This project brings the same concept and functionality to the JavaScript/Node.js ecosystem.

> [!NOTE]
> This is my first piece of AI slop. The tests were AI-generated. Honestly, the main things I implemented myself were the `Zod` schema validation and the integration of [TermDom](https://termdom.org/) with [ZikoJS](https://github.com/zikojs/ziko/) for the UI.
I could build the rest from scratch, but I don't have the time right now. I mainly needed the API to monitor my 50+ ZikoJS packages on npm.

## Task.md

```md
# <title>

- STATUS: (OPEN|CLOSED)
- PRIORITY: <number>
- TAGS: <comma-and-whitespace-separated-list-of-tags>
[other properties]

[description]
```