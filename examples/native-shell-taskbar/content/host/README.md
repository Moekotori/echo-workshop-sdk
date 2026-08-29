# Host binary

Drop the unpackaged Windows executable at `EchoShell.exe` in this folder before publishing.

The host starts it as:

    EchoShell.exe --pipe <name>

stdio must stay ignored. WinUI WinExe crashes if stdin/stdout are redirected.

Authoring `check` and `test` pass without the exe. A live ECHO / ShinawaseLoader host requires the file.
