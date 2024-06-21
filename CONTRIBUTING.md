# Contributing to the B2B SaaS Starter Kit

This document provides an outline for interacting with the repository and community, as well as the nitty-gritty details on how to write, test, and submit code changes. If you run into any trouble, open a discussion in the [Auth0 Community](https://community.auth0.com/t/saastart-b2b-saas-reference-app/136595) and someone will do their best to assist you in a timely manner.

## Contribution Process

We welcome feedback and contributions from anyone who might be interested in helping the project.

The [project maintainers](#TODO) are here to help. This is the group of people responsible for organizing the backlog of [issues](/issues), reviewing [pull requests](/pulls), and all code within this repository. Maintainers are working to keep the product aligned with its [design principles](#TODO), and to make it easy for anyone to take part in building and shaping its development and roadmap.

The rest of this document describes how to contribute code, but there are many other ways to contribute that are incredibly helpful: helping others in Discussions and Slack, providing feedback, triaging Issues, improving the documentation - any little bit helps.

## Submitting a Pull Request to the Repository

1. Read our [Pull Request Requirements](#pull-request-requirements), [Pull Request Structure and Behavior](#pull-request-structure-and-behaviour) and [Commit Guidelines](#commit-guidelines) to understand what to include in commits and PRs.

2. Fork the repository to your own GitHub account. ([Forking a repo on GitHub](https://docs.github.com/en/get-started/quickstart/fork-a-repo#forking-a-repository)).

3. Clone your forked repo locally. ([Cloning your forked repository](https://docs.github.com/en/get-started/quickstart/contributing-to-projects#cloning-a-fork)).

4. Perform the edits you wish to contribute in your cloned fork. ([Making and pushing changes](https://docs.github.com/en/get-started/quickstart/contributing-to-projects#making-and-pushing-changes)).

5. When ready, commit your changes and push them to your fork.

6. After you have committed, push this commit to your fork.

7. Open a pull request to this repository. ([Making a Pull Request](https://docs.github.com/en/get-started/quickstart/contributing-to-projects#making-a-pull-request)).

## Commit Guidelines

Check out the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) website to get ideas about how an ideal commit should be structured: 

```
<type>[optional scope]: <description>

[optional body]

[optional footer(s)]
```

The commit contains the following structural elements, to communicate intent to the consumers of your library:

* fix: a commit of the type fix patches a bug in your codebase (this correlates with PATCH in Semantic Versioning).

* feat: a commit of the type feat introduces a new feature to the codebase (this correlates with MINOR in Semantic Versioning).

* BREAKING CHANGE: a commit that has a footer BREAKING CHANGE:, or appends a ! after the type/scope, introduces a breaking API change (correlating with MAJOR in Semantic Versioning). A BREAKING CHANGE can be part of commits of any type.

* types other than fix: and feat: are allowed, for example @commitlint/config-conventional (based on the Angular convention) recommends build:, chore:, ci:, docs:, style:, refactor:, perf:, test:, and others.

* footers other than BREAKING CHANGE: <description> may be provided and follow a convention similar to git trailer format.

### Pull Request Requirements

When you're ready, submit a pull request!

* As with any community interaction, you must follow the [Code of Conduct](./CODE_OF_CONDUCT.md).

* All changes must have adequate test coverage. For instructions on writing and running the various test suites, see the CONTRIBUTING guide in each individual repository.

* All contributors should sign the [Contributor License Agreement](https://docs.linuxfoundation.org/lfx/easycla/v2-current/contributors). You'll get prompted to sign it the first time you submit a Pull Request.

* The documentation should be updated (in a separate, linked PR), but if you're not confident in your technical writing you may skip this step.

* All changes are required to be [Apache-2.0](https://www.apache.org/licenses/LICENSE-2.0) Licensed.

* Contributions should introduce minimal to no dependencies. This helps with maintenance as well as security and legal considerations.

### Pull Request Structure and Behavior

In an ideal world, every pull request is small, but the codebase is large and sometimes complex changes cannot be avoided. To ease PR reviews, there are a few practices we've found helpful:

* Focus your commits so that they only change a single component at a time.

* Isolate [structure changes from behavior changes][sb-changes] and label the commits appropriately - even better, batch commits of the same type into contiguous blocks.

* Give clear prose justifications for your changes in the commit messages - it's not unusual that you do some digging to uncover the motivation for a change, but if you don't mention it in the commit message the diff can feel pretty opaque.

[coc]: [./CODE_OF_CONDUCT.md]
