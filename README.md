# rollup-plugin-notify

Displays rollup errors as system notifications.


![Example](https://raw.githubusercontent.com/MikeKovarik/rollup-plugin-notify/master/example.gif)


## Installation

```bash
npm install --save-dev rollup-plugin-notify
```


## Usage

Pretty simple, no settings, no options, just import the `notify()` function and add it to your rollup config file. Then you can start rollup in an endless watch mode `rollup -c -w` and minimize the terminal because all incoming errors will be caught and shown as notifications!

**Rollup v0.60.0 or higher is required**


```js
// rollup.config.js
import notify from 'rollup-plugin-notify';

export default {
  // ...
  plugins: [
    notify()
  ]
};
```

Check out `./example` folder for demo app.


## Displayed information

We try to fit as much of useful information (file, code snippet, position) as possible in the little space of 4-line notification. But it is hard to test this module for all the plugins out there, each of which can and will throw different errors of various shapes.

Basic Rollup's parse errors and Babel plugin work great out of the box. If you feel like `rollup-plugin-notify` could display better errors for your favorite Rollup plugin, let us know, or better yet, hit us up with a PR.


## Contributing

Contributions, help and feedback is welcome. Underlying [node-notifier](https://www.npmjs.com/package/node-notifier) module is troublesome and difficult to test across platforms so testing and troubleshooting on other systems would be appreciated.


## License

MIT, Mike Kovařík, mutiny.cz