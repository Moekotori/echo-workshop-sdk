# Security policy

## Supported versions

Security fixes are made against the latest published `1.x` release. Older
package releases may be used for compatibility testing, but authors should
upgrade before reporting a problem that is already fixed in the latest tag.

The portable SDK can model and test the public Workshop contract, but ECHO's
production parser and sandbox remain authoritative. A local mock-host pass is
not proof that production accepts or safely executes the same content.

## Reporting a vulnerability

Do not open a public issue for a suspected validation bypass, sandbox escape,
unsafe network destination, path/hash bypass, permission mismatch, credential
exposure, or other security-sensitive behavior.

Use GitHub's private vulnerability report form:

<https://github.com/Moekotori/echo-workshop-sdk/security/advisories/new>

Include the affected SDK and ECHO versions, the smallest reproducible project,
the expected boundary, and the observed result. Remove Steam tickets, cookies,
tokens, local absolute paths, library metadata, and other personal content.

The maintainers will route host-runtime reports to the private ECHO source of
truth. Please wait for a coordinated fix before publishing exploit details.

## Out of scope

- Requests to weaken fail-closed checks or expose Node, files, raw IPC,
  Steamworks, browser cookies, or arbitrary network access.
- Third-party platform scraping, downloading, authentication bypasses, or
  credentials submitted as a plug-in setting.
- Bugs that require a modified ECHO binary, a disabled sandbox, or edited
  production validation code to reproduce.
