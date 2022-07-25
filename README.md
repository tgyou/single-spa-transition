# single-spa-transition

(WIP)

## usage
Insert this code before active of spa-root.

```js
// add this
System.import('https://styx.im/npm/@tgyou/single-spa-transition@1.0.0/single-spa-transition.js').then(module => {
  new module.default({
  // options
  }; 

  start(); // single-spa start
});
```

## options (optional)

- `duration` (number, string, default: 500)
  - Specifies how many seconds or milliseconds a transition effect takes to complete. 
- `delay` (number, string, default: 100)
  - Specifies a delay (in seconds) for the transition effect. 
- `unmountAfterMount` (boolean, default: false)
  - Specification unmount the current app when the next app is mounted. 
- `injectGlobalStylesheet` (boolean, default: true)
  - Specification injects global CSS of html, body. 
- `injectStyleSheet` (boolean, default: true)
  - Specifications inject the CSS of Transition. 