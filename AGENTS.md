# Agent instructions

Noldova owns this repository and makes the final decisions.

## Documents

Read the owner before you work on its subject, and change a rule there.

| When you… | Read |
|---|---|
| explain what the package is or who uses it | [README.md](README.md) |
| change an algorithm, the package's API or its boundaries, or write code in this repository | [documents/ARCHITECTURE.md](documents/ARCHITECTURE.md) |
| write tests or change what the checks cover | [README.md, Checks](README.md#checks) |
| write code, tests, documents or commits | the organization's standards, `https://github.com/noldova-com/.github/blob/main/standards/AGENTS.md` |
| prepare or run a release | [README.md, Releases](README.md#releases) |

## Work

- Every pull request names the issue it resolves in this repository, such as `Closes #N`, and passes the checks [README.md](README.md#checks) lists.

## Diff

- The package holds no DOM and no framework, and names no app or editor; an app or an editor uses it through its published API.
- The package's public API is everything it exports.
  A change that breaks it gets a new major version, release notes and a migration path for every app that uses it.
