# Demo GIF for the README. Re-record with: vhs .github/demo.tape
Output .github/assets/demo.gif

Set Shell "bash"
Set FontSize 18
Set FontFamily "Menlo"
Set Width 1200
Set Height 620
Set Padding 24
Set Theme "Catppuccin Mocha"
Set TypingSpeed 45ms
Set WindowBar Colorful

# Until the package is on npm, run the local build under the public command name.
Hide
Type `npx() { shift; node ./dist/cli.js "$@"; }; export PS1='$ '; clear`
Enter
Show

Sleep 600ms
Type "npx nuxt-payload-xray https://nuxt.com --top 6"
Sleep 400ms
Enter
Wait+Screen@30s /more \(use/
Sleep 3s

Type "npx nuxt-payload-xray https://nuxt.com --max 150kb --top 3; echo exit $?"
Sleep 400ms
Enter
Wait+Screen@30s /exit \d/
Sleep 4s
