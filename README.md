# tatr-ql
tatr-ql is a Node.js reimplementation of [tsoding/tatr](https://github.com/tsoding/tatr), a Task Tracker Query Language created by [Tsoding](https://github.com/tsoding).

The original project is implemented in C/C++. This project brings the same concept and functionality to the JavaScript/Node.js ecosystem.

> [!NOTE]
> For more information, watch this [Tsoding video](https://www.youtube.com/watch?v=_hxdZtXTDSw&t=4164s) covering the original C/C++ implementation. It's the same-same, but different!

> [!NOTE]
> Built to monitor and manage over 50 ZikoJS packages on npm.
Initial project scaffolding and test suites were developed with AI assistance, while core architectural layers, such as strict `Zod` schema validation and the [TermDom](https://termdom.org/)/[ZikoJS](https://github.com/zikojs/ziko/) TUI were custom-engineered.


## Install

```console
 npm i tatr-ql -g
```

## Usage

```console
tatr <command> [options]
```

### Commands

|Command|Description|
|-|-|
|`init`|Create tasks/|
|`new <title>`|Create a task|
|`ls [query]`|List tasks, optionally filtered by TQL|
|`show <id\|order>`|Show a task|
|`close <id\|order>`|Mark a task CLOSED|
|`reopen <id\|order>`|Mark a task OPEN|
|`rm <id\|order>`|Delete a task|
|`tags`|Show tag descriptions|
|`help`|Show help|
|`version`|Show the version|

#### Task References

Commands that operate on a task accept either its HUID or its order/index.

|Reference|Meaning|
|-|-|
|`20260913-120000`|Task identified by its HUID|
|`0`|First task|
|`1`|Second task|
|`-1`|Last task|
|`-2`|Second-to-last task|

- For example:

```console
$ tatr show 0
$ tatr show -1
$ tatr close 2
$ tatr rm -1
```

### Options 

#### new options

|Option|Description|
|-|-|
|`--priority <n>`|Task priority (default: 0)|
|`--tags <a,b,c>`|Comma-separated tags|
|`--suffix <name>`|HUID suffix|
|`--description <x>`|Initial description|

#### ls options

|Option|Description|
|-|-|
|`--all`|Include CLOSED tasks (default is all; kept for compatibility)|
|`--open`|Only OPEN tasks|
|`--closed`|Only CLOSED tasks|


## TASK.md

Each task is stored as a TASK.md file:

```md
# <title>

- STATUS: (OPEN|CLOSED)
- PRIORITY: <number>
- TAGS: <comma-and-whitespace-separated-list-of-tags>
[other properties]

[description]
```