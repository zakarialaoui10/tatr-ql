# Support task order

- STATUS: CLOSED
- PRIORITY: 10
- TAGS: feature, cli

## Description

Add support for referencing tasks by their order/index in addition to their HUID.

Task references should support:

- HUID: 20260913-120000
- Positive index: 0, 1, 2, ...
- Negative index: -1, -2, ...

|Index|Behaviour|
|-|-|
|`0`|first task|
|`1`|second task|
|`-1`|last task|
|`-2`|second-to-last task|

A HUID should continue to reference the task directly by its identifier.

Implement a resolveTaskId helper,
Use this resolver for commands that accept a task identifier:
`show`, `edit`, `close`, `reopen`, `rm`

The existing HUID behavior must remain unchanged.