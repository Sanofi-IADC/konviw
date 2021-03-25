/**
 * Framebus version 2.0.5
 * *** */ (() => {
  // webpackBootstrap
  /** *** */

  /** *** */ const __webpack_modules__ = {
    /***/ './node_modules/@braintree/uuid/index.js':
      /*! ***********************************************!*\
  !*** ./node_modules/@braintree/uuid/index.js ***!
  \********************************************** */
      /***/ (module) => {
        function uuid() {
          return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(
            /[xy]/g,
            function (c) {
              const r = (Math.random() * 16) | 0;
              const v = c === 'x' ? r : (r & 0x3) | 0x8;

              return v.toString(16);
            },
          );
        }

        module.exports = uuid;

        /***/
      },

    /***/ './src/framebus.ts':
      /*! *************************!*\
  !*** ./src/framebus.ts ***!
  \************************ */
      /***/ (__unused_webpack_module, exports, __webpack_require__) => {
        Object.defineProperty(exports, '__esModule', { value: true });
        exports.Framebus = void 0;
        const is_not_string_1 = __webpack_require__(
          /*! ./lib/is-not-string */ './src/lib/is-not-string.ts',
        );
        const subscription_args_invalid_1 = __webpack_require__(
          /*! ./lib/subscription-args-invalid */ './src/lib/subscription-args-invalid.ts',
        );
        const broadcast_1 = __webpack_require__(
          /*! ./lib/broadcast */ './src/lib/broadcast.ts',
        );
        const package_payload_1 = __webpack_require__(
          /*! ./lib/package-payload */ './src/lib/package-payload.ts',
        );
        const constants_1 = __webpack_require__(
          /*! ./lib/constants */ './src/lib/constants.ts',
        );
        const DefaultPromise = typeof window !== 'undefined' && window.Promise;
        Framebus = /** @class */ (function () {
          function Framebus(options) {
            if (options === void 0) {
              options = {};
            }
            this.origin = options.origin || '*';
            this.channel = options.channel || '';
            this.verifyDomain = options.verifyDomain;
            this.isDestroyed = false;
            this.listeners = [];
          }
          Framebus.setPromise = function (PromiseGlobal) {
            Framebus.Promise = PromiseGlobal;
          };
          Framebus.target = function (options) {
            return new Framebus(options);
          };
          Framebus.prototype.include = function (childWindow) {
            if (childWindow == null) {
              return false;
            }
            if (childWindow.Window == null) {
              return false;
            }
            if (childWindow.constructor !== childWindow.Window) {
              return false;
            }
            constants_1.childWindows.push(childWindow);
            return true;
          };
          Framebus.prototype.target = function (options) {
            return Framebus.target(options);
          };
          Framebus.prototype.emit = function (eventName, data, reply) {
            if (this.isDestroyed) {
              return false;
            }
            const { origin } = this;
            eventName = this.namespaceEvent(eventName);
            if (is_not_string_1.isntString(eventName)) {
              return false;
            }
            if (is_not_string_1.isntString(origin)) {
              return false;
            }
            if (typeof data === 'function') {
              reply = data;
              data = undefined; // eslint-disable-line no-undefined
            }
            const payload = package_payload_1.packagePayload(
              eventName,
              origin,
              data,
              reply,
            );
            if (!payload) {
              return false;
            }
            broadcast_1.broadcast(window.top || window.self, payload, origin);
            return true;
          };
          Framebus.prototype.emitAsPromise = function (eventName, data) {
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const _this = this;
            return new Framebus.Promise(function (resolve, reject) {
              const didAttachListener = _this.emit(
                eventName,
                data,
                function (payload) {
                  resolve(payload);
                },
              );
              if (!didAttachListener) {
                reject(new Error(`Listener not added for "${eventName}"`));
              }
            });
          };
          Framebus.prototype.on = function (eventName, originalHandler) {
            if (this.isDestroyed) {
              return false;
            }
            // eslint-disable-next-line @typescript-eslint/no-this-alias
            const self = this;
            const { origin } = this;
            let handler = originalHandler;
            eventName = this.namespaceEvent(eventName);
            if (
              subscription_args_invalid_1.subscriptionArgsInvalid(
                eventName,
                handler,
                origin,
              )
            ) {
              return false;
            }
            if (this.verifyDomain) {
              /* eslint-disable no-invalid-this, @typescript-eslint/ban-ts-comment */
              handler = function () {
                const args = [];
                for (let _i = 0; _i < arguments.length; _i++) {
                  args[_i] = arguments[_i];
                }
                // @ts-ignore
                if (self.checkOrigin(this && this.origin)) {
                  originalHandler.apply(void 0, args);
                }
              };
              /* eslint-enable no-invalid-this, @typescript-eslint/ban-ts-comment */
            }
            this.listeners.push({
              eventName,
              handler,
              originalHandler,
            });
            constants_1.subscribers[origin] =
              constants_1.subscribers[origin] || {};
            constants_1.subscribers[origin][eventName] =
              constants_1.subscribers[origin][eventName] || [];
            constants_1.subscribers[origin][eventName].push(handler);
            return true;
          };
          Framebus.prototype.off = function (eventName, originalHandler) {
            let handler = originalHandler;
            if (this.isDestroyed) {
              return false;
            }
            if (this.verifyDomain) {
              for (var i = 0; i < this.listeners.length; i++) {
                const listener = this.listeners[i];
                if (listener.originalHandler === originalHandler) {
                  handler = listener.handler;
                }
              }
            }
            eventName = this.namespaceEvent(eventName);
            const { origin } = this;
            if (
              subscription_args_invalid_1.subscriptionArgsInvalid(
                eventName,
                handler,
                origin,
              )
            ) {
              return false;
            }
            const subscriberList =
              constants_1.subscribers[origin] &&
              constants_1.subscribers[origin][eventName];
            if (!subscriberList) {
              return false;
            }
            for (var i = 0; i < subscriberList.length; i++) {
              if (subscriberList[i] === handler) {
                subscriberList.splice(i, 1);
                return true;
              }
            }
            return false;
          };
          Framebus.prototype.teardown = function () {
            if (this.isDestroyed) {
              return;
            }
            this.isDestroyed = true;
            for (let i = 0; i < this.listeners.length; i++) {
              const listener = this.listeners[i];
              this.off(listener.eventName, listener.handler);
            }
            this.listeners.length = 0;
          };
          Framebus.prototype.checkOrigin = function (postMessageOrigin) {
            let merchantHost;
            const a = document.createElement('a');
            a.href = location.href;
            if (a.protocol === 'https:') {
              merchantHost = a.host.replace(/:443$/, '');
            } else if (a.protocol === 'http:') {
              merchantHost = a.host.replace(/:80$/, '');
            } else {
              merchantHost = a.host;
            }
            const merchantOrigin = `${a.protocol}//${merchantHost}`;
            if (merchantOrigin === postMessageOrigin) {
              return true;
            }
            if (this.verifyDomain) {
              return this.verifyDomain(postMessageOrigin);
            }
            return true;
          };
          Framebus.prototype.namespaceEvent = function (eventName) {
            if (!this.channel) {
              return eventName;
            }
            return `${this.channel}:${eventName}`;
          };
          Framebus.Promise = DefaultPromise;
          return Framebus;
        })();
        exports.Framebus = Framebus;

        /***/
      },

    /***/ './src/index.ts':
      /*! **********************!*\
  !*** ./src/index.ts ***!
  \********************* */
      /***/ (module, __unused_webpack_exports, __webpack_require__) => {
        const attach_1 = __webpack_require__(
          /*! ./lib/attach */ './src/lib/attach.ts',
        );
        const framebus_1 = __webpack_require__(
          /*! ./framebus */ './src/framebus.ts',
        );
        attach_1.attach();
        module.exports = framebus_1.Framebus;

        /***/
      },

    /***/ './src/lib/attach.ts':
      /*! ***************************!*\
  !*** ./src/lib/attach.ts ***!
  \************************** */
      /***/ (__unused_webpack_module, exports, __webpack_require__) => {
        Object.defineProperty(exports, '__esModule', { value: true });
        exports.detach = exports.attach = void 0;
        const message_1 = __webpack_require__(
          /*! ./message */ './src/lib/message.ts',
        );
        let isAttached = false;
        function attach() {
          if (isAttached || typeof window === 'undefined') {
            return;
          }
          isAttached = true;
          window.addEventListener('message', message_1.onmessage, false);
        }
        exports.attach = attach;
        // removeIf(production)
        function detach() {
          isAttached = false;
          window.removeEventListener('message', message_1.onmessage, false);
        }
        exports.detach = detach;
        // endRemoveIf(production)

        /***/
      },

    /***/ './src/lib/broadcast-to-child-windows.ts':
      /*! ***********************************************!*\
  !*** ./src/lib/broadcast-to-child-windows.ts ***!
  \********************************************** */
      /***/ (__unused_webpack_module, exports, __webpack_require__) => {
        Object.defineProperty(exports, '__esModule', { value: true });
        exports.broadcastToChildWindows = void 0;
        const broadcast_1 = __webpack_require__(
          /*! ./broadcast */ './src/lib/broadcast.ts',
        );
        const constants_1 = __webpack_require__(
          /*! ./constants */ './src/lib/constants.ts',
        );
        function broadcastToChildWindows(payload, origin, source) {
          for (let i = constants_1.childWindows.length - 1; i >= 0; i--) {
            const childWindow = constants_1.childWindows[i];
            if (childWindow.closed) {
              constants_1.childWindows.splice(i, 1);
            } else if (source !== childWindow) {
              broadcast_1.broadcast(childWindow.top, payload, origin);
            }
          }
        }
        exports.broadcastToChildWindows = broadcastToChildWindows;

        /***/
      },

    /***/ './src/lib/broadcast.ts':
      /*! ******************************!*\
  !*** ./src/lib/broadcast.ts ***!
  \***************************** */
      /***/ (__unused_webpack_module, exports, __webpack_require__) => {
        Object.defineProperty(exports, '__esModule', { value: true });
        exports.broadcast = void 0;
        const has_opener_1 = __webpack_require__(
          /*! ./has-opener */ './src/lib/has-opener.ts',
        );
        function broadcast(frame, payload, origin) {
          let i = 0;
          let frameToBroadcastTo;
          try {
            frame.postMessage(payload, origin);
            if (
              has_opener_1.hasOpener(frame) &&
              frame.opener.top !== window.top
            ) {
              broadcast(frame.opener.top, payload, origin);
            }
            // previously, our max value was frame.frames.length
            // but frames.length inherits from window.length
            // which can be overwritten if a developer does
            // `var length = value;` outside of a function
            // scope, it'll prevent us from looping through
            // all the frames. With this, we loop through
            // until there are no longer any frames
            // eslint-disable-next-line no-cond-assign
            while ((frameToBroadcastTo = frame.frames[i])) {
              broadcast(frameToBroadcastTo, payload, origin);
              i++;
            }
          } catch (_) {
            /* ignored */
          }
        }
        exports.broadcast = broadcast;

        /***/
      },

    /***/ './src/lib/constants.ts':
      /*! ******************************!*\
  !*** ./src/lib/constants.ts ***!
  \***************************** */
      /***/ (__unused_webpack_module, exports) => {
        Object.defineProperty(exports, '__esModule', { value: true });
        exports.subscribers = exports.childWindows = exports.prefix = void 0;
        exports.prefix = '/*framebus*/';
        exports.childWindows = [];
        exports.subscribers = {};

        /***/
      },

    /***/ './src/lib/dispatch.ts':
      /*! *****************************!*\
  !*** ./src/lib/dispatch.ts ***!
  \**************************** */
      /***/ (__unused_webpack_module, exports, __webpack_require__) => {
        Object.defineProperty(exports, '__esModule', { value: true });
        exports.dispatch = void 0;
        const constants_1 = __webpack_require__(
          /*! ./constants */ './src/lib/constants.ts',
        );
        function dispatch(origin, event, data, reply, e) {
          if (!constants_1.subscribers[origin]) {
            return;
          }
          if (!constants_1.subscribers[origin][event]) {
            return;
          }
          const args = [];
          if (data) {
            args.push(data);
          }
          if (reply) {
            args.push(reply);
          }
          for (
            let i = 0;
            i < constants_1.subscribers[origin][event].length;
            i++
          ) {
            constants_1.subscribers[origin][event][i].apply(e, args);
          }
        }
        exports.dispatch = dispatch;

        /***/
      },

    /***/ './src/lib/has-opener.ts':
      /*! *******************************!*\
  !*** ./src/lib/has-opener.ts ***!
  \****************************** */
      /***/ (__unused_webpack_module, exports) => {
        Object.defineProperty(exports, '__esModule', { value: true });
        exports.hasOpener = void 0;
        function hasOpener(frame) {
          if (frame.top !== frame) {
            return false;
          }
          if (frame.opener == null) {
            return false;
          }
          if (frame.opener === frame) {
            return false;
          }
          if (frame.opener.closed === true) {
            return false;
          }
          return true;
        }
        exports.hasOpener = hasOpener;

        /***/
      },

    /***/ './src/lib/is-not-string.ts':
      /*! **********************************!*\
  !*** ./src/lib/is-not-string.ts ***!
  \********************************* */
      /***/ (__unused_webpack_module, exports) => {
        Object.defineProperty(exports, '__esModule', { value: true });
        exports.isntString = void 0;
        function isntString(str) {
          return typeof str !== 'string';
        }
        exports.isntString = isntString;

        /***/
      },

    /***/ './src/lib/message.ts':
      /*! ****************************!*\
  !*** ./src/lib/message.ts ***!
  \*************************** */
      /***/ (__unused_webpack_module, exports, __webpack_require__) => {
        Object.defineProperty(exports, '__esModule', { value: true });
        exports.onmessage = void 0;
        const is_not_string_1 = __webpack_require__(
          /*! ./is-not-string */ './src/lib/is-not-string.ts',
        );
        const unpack_payload_1 = __webpack_require__(
          /*! ./unpack-payload */ './src/lib/unpack-payload.ts',
        );
        const dispatch_1 = __webpack_require__(
          /*! ./dispatch */ './src/lib/dispatch.ts',
        );
        const broadcast_to_child_windows_1 = __webpack_require__(
          /*! ./broadcast-to-child-windows */ './src/lib/broadcast-to-child-windows.ts',
        );
        function onmessage(e) {
          if (is_not_string_1.isntString(e.data)) {
            return;
          }
          const payload = unpack_payload_1.unpackPayload(e);
          if (!payload) {
            return;
          }
          const data = payload.eventData;
          const { reply } = payload;
          dispatch_1.dispatch('*', payload.event, data, reply, e);
          dispatch_1.dispatch(e.origin, payload.event, data, reply, e);
          broadcast_to_child_windows_1.broadcastToChildWindows(
            e.data,
            payload.origin,
            e.source,
          );
        }
        exports.onmessage = onmessage;

        /***/
      },

    /***/ './src/lib/package-payload.ts':
      /*! ************************************!*\
  !*** ./src/lib/package-payload.ts ***!
  \*********************************** */
      /***/ (__unused_webpack_module, exports, __webpack_require__) => {
        Object.defineProperty(exports, '__esModule', { value: true });
        exports.packagePayload = void 0;
        const subscribe_replier_1 = __webpack_require__(
          /*! ./subscribe-replier */ './src/lib/subscribe-replier.ts',
        );
        const constants_1 = __webpack_require__(
          /*! ./constants */ './src/lib/constants.ts',
        );
        function packagePayload(event, origin, data, reply) {
          let packaged;
          const payload = {
            event,
            origin,
          };
          if (typeof reply === 'function') {
            payload.reply = subscribe_replier_1.subscribeReplier(reply, origin);
          }
          payload.eventData = data;
          try {
            packaged = constants_1.prefix + JSON.stringify(payload);
          } catch (e) {
            throw new Error(`Could not stringify event: ${e.message}`);
          }
          return packaged;
        }
        exports.packagePayload = packagePayload;

        /***/
      },

    /***/ './src/lib/subscribe-replier.ts':
      /*! **************************************!*\
  !*** ./src/lib/subscribe-replier.ts ***!
  \************************************* */
      /***/ function (__unused_webpack_module, exports, __webpack_require__) {
        const __importDefault =
          (this && this.__importDefault) ||
          function (mod) {
            return mod && mod.__esModule ? mod : { default: mod };
          };
        Object.defineProperty(exports, '__esModule', { value: true });
        exports.subscribeReplier = void 0;
        const framebus_1 = __webpack_require__(
          /*! ../framebus */ './src/framebus.ts',
        );
        const uuid_1 = __importDefault(
          __webpack_require__(
            /*! @braintree/uuid */ './node_modules/@braintree/uuid/index.js',
          ),
        );
        function subscribeReplier(fn, origin) {
          const uuid = uuid_1.default();
          function replier(data, replyOriginHandler) {
            fn(data, replyOriginHandler);
            framebus_1.Framebus.target({
              origin,
            }).off(uuid, replier);
          }
          framebus_1.Framebus.target({
            origin,
          }).on(uuid, replier);
          return uuid;
        }
        exports.subscribeReplier = subscribeReplier;

        /***/
      },

    /***/ './src/lib/subscription-args-invalid.ts':
      /*! **********************************************!*\
  !*** ./src/lib/subscription-args-invalid.ts ***!
  \********************************************* */
      /***/ (__unused_webpack_module, exports, __webpack_require__) => {
        Object.defineProperty(exports, '__esModule', { value: true });
        exports.subscriptionArgsInvalid = void 0;
        const is_not_string_1 = __webpack_require__(
          /*! ./is-not-string */ './src/lib/is-not-string.ts',
        );
        function subscriptionArgsInvalid(event, fn, origin) {
          if (is_not_string_1.isntString(event)) {
            return true;
          }
          if (typeof fn !== 'function') {
            return true;
          }
          return is_not_string_1.isntString(origin);
        }
        exports.subscriptionArgsInvalid = subscriptionArgsInvalid;

        /***/
      },

    /***/ './src/lib/unpack-payload.ts':
      /*! ***********************************!*\
  !*** ./src/lib/unpack-payload.ts ***!
  \********************************** */
      /***/ (__unused_webpack_module, exports, __webpack_require__) => {
        Object.defineProperty(exports, '__esModule', { value: true });
        exports.unpackPayload = void 0;
        const constants_1 = __webpack_require__(
          /*! ./constants */ './src/lib/constants.ts',
        );
        const package_payload_1 = __webpack_require__(
          /*! ./package-payload */ './src/lib/package-payload.ts',
        );
        function unpackPayload(e) {
          let payload;
          if (
            e.data.slice(0, constants_1.prefix.length) !== constants_1.prefix
          ) {
            return false;
          }
          try {
            payload = JSON.parse(e.data.slice(constants_1.prefix.length));
          } catch (err) {
            return false;
          }
          if (payload.reply) {
            const replyOrigin_1 = e.origin;
            const replySource_1 = e.source;
            const replyEvent_1 = payload.reply;
            payload.reply = function reply(replyData) {
              if (!replySource_1) {
                return;
              }
              const replyPayload = package_payload_1.packagePayload(
                replyEvent_1,
                replyOrigin_1,
                replyData,
              );
              if (!replyPayload) {
                return;
              }
              replySource_1.postMessage(replyPayload, replyOrigin_1);
            };
          }
          return payload;
        }
        exports.unpackPayload = unpackPayload;

        /***/
      },

    /** *** */
  }; // The module cache
  /** ********************************************************************* */
  /** *** */ /** *** */ const __webpack_module_cache__ = {}; // The require function
  /** *** */
  /** *** */ /** *** */ function __webpack_require__(moduleId) {
    /** *** */ // Check if module is in cache
    /** *** */ if (__webpack_module_cache__[moduleId]) {
      /** *** */ return __webpack_module_cache__[moduleId].exports;
      /** *** */
    } // Create a new module (and put it into the cache)
    /** *** */ /** *** */ const module = (__webpack_module_cache__[moduleId] = {
      /** *** */ // no module.id needed
      /** *** */ // no module.loaded needed
      /** *** */ exports: {},
      /** *** */
    }); // Execute the module function
    /** *** */
    /** *** */ /** *** */ __webpack_modules__[moduleId].call(
      module.exports,
      module,
      module.exports,
      __webpack_require__,
    ); // Return the exports of the module
    /** *** */
    /** *** */ /** *** */ return module.exports;
    /** *** */
  } // startup // Load entry module and return exports // This entry module is referenced by other modules so it can't be inlined
  /** *** */
  /** ********************************************************************* */
  /** *** */
  /** *** */ /** *** */ /** *** */ /** *** */ const __webpack_exports__ = __webpack_require__(
    './src/index.ts',
  );
  /** *** */
  /** *** */
})();
// # sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly9mcmFtZWJ1cy8uL25vZGVfbW9kdWxlcy9AYnJhaW50cmVlL3V1aWQvaW5kZXguanMiLCJ3ZWJwYWNrOi8vZnJhbWVidXMvLi9zcmMvZnJhbWVidXMudHMiLCJ3ZWJwYWNrOi8vZnJhbWVidXMvLi9zcmMvaW5kZXgudHMiLCJ3ZWJwYWNrOi8vZnJhbWVidXMvLi9zcmMvbGliL2F0dGFjaC50cyIsIndlYnBhY2s6Ly9mcmFtZWJ1cy8uL3NyYy9saWIvYnJvYWRjYXN0LXRvLWNoaWxkLXdpbmRvd3MudHMiLCJ3ZWJwYWNrOi8vZnJhbWVidXMvLi9zcmMvbGliL2Jyb2FkY2FzdC50cyIsIndlYnBhY2s6Ly9mcmFtZWJ1cy8uL3NyYy9saWIvY29uc3RhbnRzLnRzIiwid2VicGFjazovL2ZyYW1lYnVzLy4vc3JjL2xpYi9kaXNwYXRjaC50cyIsIndlYnBhY2s6Ly9mcmFtZWJ1cy8uL3NyYy9saWIvaGFzLW9wZW5lci50cyIsIndlYnBhY2s6Ly9mcmFtZWJ1cy8uL3NyYy9saWIvaXMtbm90LXN0cmluZy50cyIsIndlYnBhY2s6Ly9mcmFtZWJ1cy8uL3NyYy9saWIvbWVzc2FnZS50cyIsIndlYnBhY2s6Ly9mcmFtZWJ1cy8uL3NyYy9saWIvcGFja2FnZS1wYXlsb2FkLnRzIiwid2VicGFjazovL2ZyYW1lYnVzLy4vc3JjL2xpYi9zdWJzY3JpYmUtcmVwbGllci50cyIsIndlYnBhY2s6Ly9mcmFtZWJ1cy8uL3NyYy9saWIvc3Vic2NyaXB0aW9uLWFyZ3MtaW52YWxpZC50cyIsIndlYnBhY2s6Ly9mcmFtZWJ1cy8uL3NyYy9saWIvdW5wYWNrLXBheWxvYWQudHMiLCJ3ZWJwYWNrOi8vZnJhbWVidXMvd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vZnJhbWVidXMvd2VicGFjay9zdGFydHVwIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiI7Ozs7Ozs7Ozs7QUFBYTs7QUFFYjtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBLEdBQUc7QUFDSDs7QUFF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QTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTtVQUNBO1VBQ0E7VUFDQTs7VUFFQTtVQUNBOztVQUVBO1VBQ0E7VUFDQTs7OztVQ3JCQTtVQUNBO1VBQ0E7VUFDQSIsImZpbGUiOiJtYWluLWJ1bmRsZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIid1c2Ugc3RyaWN0JztcblxuZnVuY3Rpb24gdXVpZCgpIHtcbiAgcmV0dXJuICd4eHh4eHh4eC14eHh4LTR4eHgteXh4eC14eHh4eHh4eHh4eHgnLnJlcGxhY2UoL1t4eV0vZywgZnVuY3Rpb24gKGMpIHtcbiAgICB2YXIgciA9IE1hdGgucmFuZG9tKCkgKiAxNiB8IDA7XG4gICAgdmFyIHYgPSBjID09PSAneCcgPyByIDogciAmIDB4MyB8IDB4ODtcblxuICAgIHJldHVybiB2LnRvU3RyaW5nKDE2KTtcbiAgfSk7XG59XG5cbm1vZHVsZS5leHBvcnRzID0gdXVpZDtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5GcmFtZWJ1cyA9IHZvaWQgMDtcbnZhciBpc19ub3Rfc3RyaW5nXzEgPSByZXF1aXJlKFwiLi9saWIvaXMtbm90LXN0cmluZ1wiKTtcbnZhciBzdWJzY3JpcHRpb25fYXJnc19pbnZhbGlkXzEgPSByZXF1aXJlKFwiLi9saWIvc3Vic2NyaXB0aW9uLWFyZ3MtaW52YWxpZFwiKTtcbnZhciBicm9hZGNhc3RfMSA9IHJlcXVpcmUoXCIuL2xpYi9icm9hZGNhc3RcIik7XG52YXIgcGFja2FnZV9wYXlsb2FkXzEgPSByZXF1aXJlKFwiLi9saWIvcGFja2FnZS1wYXlsb2FkXCIpO1xudmFyIGNvbnN0YW50c18xID0gcmVxdWlyZShcIi4vbGliL2NvbnN0YW50c1wiKTtcbnZhciBEZWZhdWx0UHJvbWlzZSA9ICh0eXBlb2Ygd2luZG93ICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgd2luZG93LlByb21pc2UpO1xudmFyIEZyYW1lYnVzID0gLyoqIEBjbGFzcyAqLyAoZnVuY3Rpb24gKCkge1xuICAgIGZ1bmN0aW9uIEZyYW1lYnVzKG9wdGlvbnMpIHtcbiAgICAgICAgaWYgKG9wdGlvbnMgPT09IHZvaWQgMCkgeyBvcHRpb25zID0ge307IH1cbiAgICAgICAgdGhpcy5vcmlnaW4gPSBvcHRpb25zLm9yaWdpbiB8fCBcIipcIjtcbiAgICAgICAgdGhpcy5jaGFubmVsID0gb3B0aW9ucy5jaGFubmVsIHx8IFwiXCI7XG4gICAgICAgIHRoaXMudmVyaWZ5RG9tYWluID0gb3B0aW9ucy52ZXJpZnlEb21haW47XG4gICAgICAgIHRoaXMuaXNEZXN0cm95ZWQgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5saXN0ZW5lcnMgPSBbXTtcbiAgICB9XG4gICAgRnJhbWVidXMuc2V0UHJvbWlzZSA9IGZ1bmN0aW9uIChQcm9taXNlR2xvYmFsKSB7XG4gICAgICAgIEZyYW1lYnVzLlByb21pc2UgPSBQcm9taXNlR2xvYmFsO1xuICAgIH07XG4gICAgRnJhbWVidXMudGFyZ2V0ID0gZnVuY3Rpb24gKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBGcmFtZWJ1cyhvcHRpb25zKTtcbiAgICB9O1xuICAgIEZyYW1lYnVzLnByb3RvdHlwZS5pbmNsdWRlID0gZnVuY3Rpb24gKGNoaWxkV2luZG93KSB7XG4gICAgICAgIGlmIChjaGlsZFdpbmRvdyA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoaWxkV2luZG93LldpbmRvdyA9PSBudWxsKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNoaWxkV2luZG93LmNvbnN0cnVjdG9yICE9PSBjaGlsZFdpbmRvdy5XaW5kb3cpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdGFudHNfMS5jaGlsZFdpbmRvd3MucHVzaChjaGlsZFdpbmRvdyk7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH07XG4gICAgRnJhbWVidXMucHJvdG90eXBlLnRhcmdldCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiBGcmFtZWJ1cy50YXJnZXQob3B0aW9ucyk7XG4gICAgfTtcbiAgICBGcmFtZWJ1cy5wcm90b3R5cGUuZW1pdCA9IGZ1bmN0aW9uIChldmVudE5hbWUsIGRhdGEsIHJlcGx5KSB7XG4gICAgICAgIGlmICh0aGlzLmlzRGVzdHJveWVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9yaWdpbiA9IHRoaXMub3JpZ2luO1xuICAgICAgICBldmVudE5hbWUgPSB0aGlzLm5hbWVzcGFjZUV2ZW50KGV2ZW50TmFtZSk7XG4gICAgICAgIGlmIChpc19ub3Rfc3RyaW5nXzEuaXNudFN0cmluZyhldmVudE5hbWUpKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGlzX25vdF9zdHJpbmdfMS5pc250U3RyaW5nKG9yaWdpbikpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodHlwZW9mIGRhdGEgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgcmVwbHkgPSBkYXRhO1xuICAgICAgICAgICAgZGF0YSA9IHVuZGVmaW5lZDsgLy8gZXNsaW50LWRpc2FibGUtbGluZSBuby11bmRlZmluZWRcbiAgICAgICAgfVxuICAgICAgICB2YXIgcGF5bG9hZCA9IHBhY2thZ2VfcGF5bG9hZF8xLnBhY2thZ2VQYXlsb2FkKGV2ZW50TmFtZSwgb3JpZ2luLCBkYXRhLCByZXBseSk7XG4gICAgICAgIGlmICghcGF5bG9hZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGJyb2FkY2FzdF8xLmJyb2FkY2FzdCh3aW5kb3cudG9wIHx8IHdpbmRvdy5zZWxmLCBwYXlsb2FkLCBvcmlnaW4pO1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIEZyYW1lYnVzLnByb3RvdHlwZS5lbWl0QXNQcm9taXNlID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgZGF0YSkge1xuICAgICAgICB2YXIgX3RoaXMgPSB0aGlzO1xuICAgICAgICByZXR1cm4gbmV3IEZyYW1lYnVzLlByb21pc2UoZnVuY3Rpb24gKHJlc29sdmUsIHJlamVjdCkge1xuICAgICAgICAgICAgdmFyIGRpZEF0dGFjaExpc3RlbmVyID0gX3RoaXMuZW1pdChldmVudE5hbWUsIGRhdGEsIGZ1bmN0aW9uIChwYXlsb2FkKSB7XG4gICAgICAgICAgICAgICAgcmVzb2x2ZShwYXlsb2FkKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKCFkaWRBdHRhY2hMaXN0ZW5lcikge1xuICAgICAgICAgICAgICAgIHJlamVjdChuZXcgRXJyb3IoXCJMaXN0ZW5lciBub3QgYWRkZWQgZm9yIFxcXCJcIiArIGV2ZW50TmFtZSArIFwiXFxcIlwiKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG4gICAgRnJhbWVidXMucHJvdG90eXBlLm9uID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgb3JpZ2luYWxIYW5kbGVyKSB7XG4gICAgICAgIGlmICh0aGlzLmlzRGVzdHJveWVkKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby10aGlzLWFsaWFzXG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIG9yaWdpbiA9IHRoaXMub3JpZ2luO1xuICAgICAgICB2YXIgaGFuZGxlciA9IG9yaWdpbmFsSGFuZGxlcjtcbiAgICAgICAgZXZlbnROYW1lID0gdGhpcy5uYW1lc3BhY2VFdmVudChldmVudE5hbWUpO1xuICAgICAgICBpZiAoc3Vic2NyaXB0aW9uX2FyZ3NfaW52YWxpZF8xLnN1YnNjcmlwdGlvbkFyZ3NJbnZhbGlkKGV2ZW50TmFtZSwgaGFuZGxlciwgb3JpZ2luKSkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnZlcmlmeURvbWFpbikge1xuICAgICAgICAgICAgLyogZXNsaW50LWRpc2FibGUgbm8taW52YWxpZC10aGlzLCBAdHlwZXNjcmlwdC1lc2xpbnQvYmFuLXRzLWNvbW1lbnQgKi9cbiAgICAgICAgICAgIGhhbmRsZXIgPSBmdW5jdGlvbiAoKSB7XG4gICAgICAgICAgICAgICAgdmFyIGFyZ3MgPSBbXTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBfaSA9IDA7IF9pIDwgYXJndW1lbnRzLmxlbmd0aDsgX2krKykge1xuICAgICAgICAgICAgICAgICAgICBhcmdzW19pXSA9IGFyZ3VtZW50c1tfaV07XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgICAgICAgICAgICBpZiAoc2VsZi5jaGVja09yaWdpbih0aGlzICYmIHRoaXMub3JpZ2luKSkge1xuICAgICAgICAgICAgICAgICAgICBvcmlnaW5hbEhhbmRsZXIuYXBwbHkodm9pZCAwLCBhcmdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgLyogZXNsaW50LWVuYWJsZSBuby1pbnZhbGlkLXRoaXMsIEB0eXBlc2NyaXB0LWVzbGludC9iYW4tdHMtY29tbWVudCAqL1xuICAgICAgICB9XG4gICAgICAgIHRoaXMubGlzdGVuZXJzLnB1c2goe1xuICAgICAgICAgICAgZXZlbnROYW1lOiBldmVudE5hbWUsXG4gICAgICAgICAgICBoYW5kbGVyOiBoYW5kbGVyLFxuICAgICAgICAgICAgb3JpZ2luYWxIYW5kbGVyOiBvcmlnaW5hbEhhbmRsZXIsXG4gICAgICAgIH0pO1xuICAgICAgICBjb25zdGFudHNfMS5zdWJzY3JpYmVyc1tvcmlnaW5dID0gY29uc3RhbnRzXzEuc3Vic2NyaWJlcnNbb3JpZ2luXSB8fCB7fTtcbiAgICAgICAgY29uc3RhbnRzXzEuc3Vic2NyaWJlcnNbb3JpZ2luXVtldmVudE5hbWVdID0gY29uc3RhbnRzXzEuc3Vic2NyaWJlcnNbb3JpZ2luXVtldmVudE5hbWVdIHx8IFtdO1xuICAgICAgICBjb25zdGFudHNfMS5zdWJzY3JpYmVyc1tvcmlnaW5dW2V2ZW50TmFtZV0ucHVzaChoYW5kbGVyKTtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfTtcbiAgICBGcmFtZWJ1cy5wcm90b3R5cGUub2ZmID0gZnVuY3Rpb24gKGV2ZW50TmFtZSwgb3JpZ2luYWxIYW5kbGVyKSB7XG4gICAgICAgIHZhciBoYW5kbGVyID0gb3JpZ2luYWxIYW5kbGVyO1xuICAgICAgICBpZiAodGhpcy5pc0Rlc3Ryb3llZCkge1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnZlcmlmeURvbWFpbikge1xuICAgICAgICAgICAgZm9yICh2YXIgaSA9IDA7IGkgPCB0aGlzLmxpc3RlbmVycy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgIHZhciBsaXN0ZW5lciA9IHRoaXMubGlzdGVuZXJzW2ldO1xuICAgICAgICAgICAgICAgIGlmIChsaXN0ZW5lci5vcmlnaW5hbEhhbmRsZXIgPT09IG9yaWdpbmFsSGFuZGxlcikge1xuICAgICAgICAgICAgICAgICAgICBoYW5kbGVyID0gbGlzdGVuZXIuaGFuZGxlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZXZlbnROYW1lID0gdGhpcy5uYW1lc3BhY2VFdmVudChldmVudE5hbWUpO1xuICAgICAgICB2YXIgb3JpZ2luID0gdGhpcy5vcmlnaW47XG4gICAgICAgIGlmIChzdWJzY3JpcHRpb25fYXJnc19pbnZhbGlkXzEuc3Vic2NyaXB0aW9uQXJnc0ludmFsaWQoZXZlbnROYW1lLCBoYW5kbGVyLCBvcmlnaW4pKSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIHN1YnNjcmliZXJMaXN0ID0gY29uc3RhbnRzXzEuc3Vic2NyaWJlcnNbb3JpZ2luXSAmJiBjb25zdGFudHNfMS5zdWJzY3JpYmVyc1tvcmlnaW5dW2V2ZW50TmFtZV07XG4gICAgICAgIGlmICghc3Vic2NyaWJlckxpc3QpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHN1YnNjcmliZXJMaXN0Lmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBpZiAoc3Vic2NyaWJlckxpc3RbaV0gPT09IGhhbmRsZXIpIHtcbiAgICAgICAgICAgICAgICBzdWJzY3JpYmVyTGlzdC5zcGxpY2UoaSwgMSk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH07XG4gICAgRnJhbWVidXMucHJvdG90eXBlLnRlYXJkb3duID0gZnVuY3Rpb24gKCkge1xuICAgICAgICBpZiAodGhpcy5pc0Rlc3Ryb3llZCkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuaXNEZXN0cm95ZWQgPSB0cnVlO1xuICAgICAgICBmb3IgKHZhciBpID0gMDsgaSA8IHRoaXMubGlzdGVuZXJzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIgbGlzdGVuZXIgPSB0aGlzLmxpc3RlbmVyc1tpXTtcbiAgICAgICAgICAgIHRoaXMub2ZmKGxpc3RlbmVyLmV2ZW50TmFtZSwgbGlzdGVuZXIuaGFuZGxlcik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5saXN0ZW5lcnMubGVuZ3RoID0gMDtcbiAgICB9O1xuICAgIEZyYW1lYnVzLnByb3RvdHlwZS5jaGVja09yaWdpbiA9IGZ1bmN0aW9uIChwb3N0TWVzc2FnZU9yaWdpbikge1xuICAgICAgICB2YXIgbWVyY2hhbnRIb3N0O1xuICAgICAgICB2YXIgYSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJhXCIpO1xuICAgICAgICBhLmhyZWYgPSBsb2NhdGlvbi5ocmVmO1xuICAgICAgICBpZiAoYS5wcm90b2NvbCA9PT0gXCJodHRwczpcIikge1xuICAgICAgICAgICAgbWVyY2hhbnRIb3N0ID0gYS5ob3N0LnJlcGxhY2UoLzo0NDMkLywgXCJcIik7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAoYS5wcm90b2NvbCA9PT0gXCJodHRwOlwiKSB7XG4gICAgICAgICAgICBtZXJjaGFudEhvc3QgPSBhLmhvc3QucmVwbGFjZSgvOjgwJC8sIFwiXCIpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgbWVyY2hhbnRIb3N0ID0gYS5ob3N0O1xuICAgICAgICB9XG4gICAgICAgIHZhciBtZXJjaGFudE9yaWdpbiA9IGEucHJvdG9jb2wgKyBcIi8vXCIgKyBtZXJjaGFudEhvc3Q7XG4gICAgICAgIGlmIChtZXJjaGFudE9yaWdpbiA9PT0gcG9zdE1lc3NhZ2VPcmlnaW4pIHtcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICB9XG4gICAgICAgIGlmICh0aGlzLnZlcmlmeURvbWFpbikge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMudmVyaWZ5RG9tYWluKHBvc3RNZXNzYWdlT3JpZ2luKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9O1xuICAgIEZyYW1lYnVzLnByb3RvdHlwZS5uYW1lc3BhY2VFdmVudCA9IGZ1bmN0aW9uIChldmVudE5hbWUpIHtcbiAgICAgICAgaWYgKCF0aGlzLmNoYW5uZWwpIHtcbiAgICAgICAgICAgIHJldHVybiBldmVudE5hbWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuY2hhbm5lbCArIFwiOlwiICsgZXZlbnROYW1lO1xuICAgIH07XG4gICAgRnJhbWVidXMuUHJvbWlzZSA9IERlZmF1bHRQcm9taXNlO1xuICAgIHJldHVybiBGcmFtZWJ1cztcbn0oKSk7XG5leHBvcnRzLkZyYW1lYnVzID0gRnJhbWVidXM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBhdHRhY2hfMSA9IHJlcXVpcmUoXCIuL2xpYi9hdHRhY2hcIik7XG52YXIgZnJhbWVidXNfMSA9IHJlcXVpcmUoXCIuL2ZyYW1lYnVzXCIpO1xuYXR0YWNoXzEuYXR0YWNoKCk7XG5tb2R1bGUuZXhwb3J0cyA9IGZyYW1lYnVzXzEuRnJhbWVidXM7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuZGV0YWNoID0gZXhwb3J0cy5hdHRhY2ggPSB2b2lkIDA7XG52YXIgbWVzc2FnZV8xID0gcmVxdWlyZShcIi4vbWVzc2FnZVwiKTtcbnZhciBpc0F0dGFjaGVkID0gZmFsc2U7XG5mdW5jdGlvbiBhdHRhY2goKSB7XG4gICAgaWYgKGlzQXR0YWNoZWQgfHwgdHlwZW9mIHdpbmRvdyA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIGlzQXR0YWNoZWQgPSB0cnVlO1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBtZXNzYWdlXzEub25tZXNzYWdlLCBmYWxzZSk7XG59XG5leHBvcnRzLmF0dGFjaCA9IGF0dGFjaDtcbi8vIHJlbW92ZUlmKHByb2R1Y3Rpb24pXG5mdW5jdGlvbiBkZXRhY2goKSB7XG4gICAgaXNBdHRhY2hlZCA9IGZhbHNlO1xuICAgIHdpbmRvdy5yZW1vdmVFdmVudExpc3RlbmVyKFwibWVzc2FnZVwiLCBtZXNzYWdlXzEub25tZXNzYWdlLCBmYWxzZSk7XG59XG5leHBvcnRzLmRldGFjaCA9IGRldGFjaDtcbi8vIGVuZFJlbW92ZUlmKHByb2R1Y3Rpb24pXG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuYnJvYWRjYXN0VG9DaGlsZFdpbmRvd3MgPSB2b2lkIDA7XG52YXIgYnJvYWRjYXN0XzEgPSByZXF1aXJlKFwiLi9icm9hZGNhc3RcIik7XG52YXIgY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiLi9jb25zdGFudHNcIik7XG5mdW5jdGlvbiBicm9hZGNhc3RUb0NoaWxkV2luZG93cyhwYXlsb2FkLCBvcmlnaW4sIHNvdXJjZSkge1xuICAgIGZvciAodmFyIGkgPSBjb25zdGFudHNfMS5jaGlsZFdpbmRvd3MubGVuZ3RoIC0gMTsgaSA+PSAwOyBpLS0pIHtcbiAgICAgICAgdmFyIGNoaWxkV2luZG93ID0gY29uc3RhbnRzXzEuY2hpbGRXaW5kb3dzW2ldO1xuICAgICAgICBpZiAoY2hpbGRXaW5kb3cuY2xvc2VkKSB7XG4gICAgICAgICAgICBjb25zdGFudHNfMS5jaGlsZFdpbmRvd3Muc3BsaWNlKGksIDEpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKHNvdXJjZSAhPT0gY2hpbGRXaW5kb3cpIHtcbiAgICAgICAgICAgIGJyb2FkY2FzdF8xLmJyb2FkY2FzdChjaGlsZFdpbmRvdy50b3AsIHBheWxvYWQsIG9yaWdpbik7XG4gICAgICAgIH1cbiAgICB9XG59XG5leHBvcnRzLmJyb2FkY2FzdFRvQ2hpbGRXaW5kb3dzID0gYnJvYWRjYXN0VG9DaGlsZFdpbmRvd3M7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuYnJvYWRjYXN0ID0gdm9pZCAwO1xudmFyIGhhc19vcGVuZXJfMSA9IHJlcXVpcmUoXCIuL2hhcy1vcGVuZXJcIik7XG5mdW5jdGlvbiBicm9hZGNhc3QoZnJhbWUsIHBheWxvYWQsIG9yaWdpbikge1xuICAgIHZhciBpID0gMDtcbiAgICB2YXIgZnJhbWVUb0Jyb2FkY2FzdFRvO1xuICAgIHRyeSB7XG4gICAgICAgIGZyYW1lLnBvc3RNZXNzYWdlKHBheWxvYWQsIG9yaWdpbik7XG4gICAgICAgIGlmIChoYXNfb3BlbmVyXzEuaGFzT3BlbmVyKGZyYW1lKSAmJiBmcmFtZS5vcGVuZXIudG9wICE9PSB3aW5kb3cudG9wKSB7XG4gICAgICAgICAgICBicm9hZGNhc3QoZnJhbWUub3BlbmVyLnRvcCwgcGF5bG9hZCwgb3JpZ2luKTtcbiAgICAgICAgfVxuICAgICAgICAvLyBwcmV2aW91c2x5LCBvdXIgbWF4IHZhbHVlIHdhcyBmcmFtZS5mcmFtZXMubGVuZ3RoXG4gICAgICAgIC8vIGJ1dCBmcmFtZXMubGVuZ3RoIGluaGVyaXRzIGZyb20gd2luZG93Lmxlbmd0aFxuICAgICAgICAvLyB3aGljaCBjYW4gYmUgb3ZlcndyaXR0ZW4gaWYgYSBkZXZlbG9wZXIgZG9lc1xuICAgICAgICAvLyBgdmFyIGxlbmd0aCA9IHZhbHVlO2Agb3V0c2lkZSBvZiBhIGZ1bmN0aW9uXG4gICAgICAgIC8vIHNjb3BlLCBpdCdsbCBwcmV2ZW50IHVzIGZyb20gbG9vcGluZyB0aHJvdWdoXG4gICAgICAgIC8vIGFsbCB0aGUgZnJhbWVzLiBXaXRoIHRoaXMsIHdlIGxvb3AgdGhyb3VnaFxuICAgICAgICAvLyB1bnRpbCB0aGVyZSBhcmUgbm8gbG9uZ2VyIGFueSBmcmFtZXNcbiAgICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIG5vLWNvbmQtYXNzaWduXG4gICAgICAgIHdoaWxlICgoZnJhbWVUb0Jyb2FkY2FzdFRvID0gZnJhbWUuZnJhbWVzW2ldKSkge1xuICAgICAgICAgICAgYnJvYWRjYXN0KGZyYW1lVG9Ccm9hZGNhc3RUbywgcGF5bG9hZCwgb3JpZ2luKTtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICBjYXRjaCAoXykge1xuICAgICAgICAvKiBpZ25vcmVkICovXG4gICAgfVxufVxuZXhwb3J0cy5icm9hZGNhc3QgPSBicm9hZGNhc3Q7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuc3Vic2NyaWJlcnMgPSBleHBvcnRzLmNoaWxkV2luZG93cyA9IGV4cG9ydHMucHJlZml4ID0gdm9pZCAwO1xuZXhwb3J0cy5wcmVmaXggPSBcIi8qZnJhbWVidXMqL1wiO1xuZXhwb3J0cy5jaGlsZFdpbmRvd3MgPSBbXTtcbmV4cG9ydHMuc3Vic2NyaWJlcnMgPSB7fTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5kaXNwYXRjaCA9IHZvaWQgMDtcbnZhciBjb25zdGFudHNfMSA9IHJlcXVpcmUoXCIuL2NvbnN0YW50c1wiKTtcbmZ1bmN0aW9uIGRpc3BhdGNoKG9yaWdpbiwgZXZlbnQsIGRhdGEsIHJlcGx5LCBlKSB7XG4gICAgaWYgKCFjb25zdGFudHNfMS5zdWJzY3JpYmVyc1tvcmlnaW5dKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCFjb25zdGFudHNfMS5zdWJzY3JpYmVyc1tvcmlnaW5dW2V2ZW50XSkge1xuICAgICAgICByZXR1cm47XG4gICAgfVxuICAgIHZhciBhcmdzID0gW107XG4gICAgaWYgKGRhdGEpIHtcbiAgICAgICAgYXJncy5wdXNoKGRhdGEpO1xuICAgIH1cbiAgICBpZiAocmVwbHkpIHtcbiAgICAgICAgYXJncy5wdXNoKHJlcGx5KTtcbiAgICB9XG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb25zdGFudHNfMS5zdWJzY3JpYmVyc1tvcmlnaW5dW2V2ZW50XS5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdGFudHNfMS5zdWJzY3JpYmVyc1tvcmlnaW5dW2V2ZW50XVtpXS5hcHBseShlLCBhcmdzKTtcbiAgICB9XG59XG5leHBvcnRzLmRpc3BhdGNoID0gZGlzcGF0Y2g7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuaGFzT3BlbmVyID0gdm9pZCAwO1xuZnVuY3Rpb24gaGFzT3BlbmVyKGZyYW1lKSB7XG4gICAgaWYgKGZyYW1lLnRvcCAhPT0gZnJhbWUpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoZnJhbWUub3BlbmVyID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBpZiAoZnJhbWUub3BlbmVyID09PSBmcmFtZSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIGlmIChmcmFtZS5vcGVuZXIuY2xvc2VkID09PSB0cnVlKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgcmV0dXJuIHRydWU7XG59XG5leHBvcnRzLmhhc09wZW5lciA9IGhhc09wZW5lcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5pc250U3RyaW5nID0gdm9pZCAwO1xuZnVuY3Rpb24gaXNudFN0cmluZyhzdHIpIHtcbiAgICByZXR1cm4gdHlwZW9mIHN0ciAhPT0gXCJzdHJpbmdcIjtcbn1cbmV4cG9ydHMuaXNudFN0cmluZyA9IGlzbnRTdHJpbmc7XG4iLCJcInVzZSBzdHJpY3RcIjtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMub25tZXNzYWdlID0gdm9pZCAwO1xudmFyIGlzX25vdF9zdHJpbmdfMSA9IHJlcXVpcmUoXCIuL2lzLW5vdC1zdHJpbmdcIik7XG52YXIgdW5wYWNrX3BheWxvYWRfMSA9IHJlcXVpcmUoXCIuL3VucGFjay1wYXlsb2FkXCIpO1xudmFyIGRpc3BhdGNoXzEgPSByZXF1aXJlKFwiLi9kaXNwYXRjaFwiKTtcbnZhciBicm9hZGNhc3RfdG9fY2hpbGRfd2luZG93c18xID0gcmVxdWlyZShcIi4vYnJvYWRjYXN0LXRvLWNoaWxkLXdpbmRvd3NcIik7XG5mdW5jdGlvbiBvbm1lc3NhZ2UoZSkge1xuICAgIGlmIChpc19ub3Rfc3RyaW5nXzEuaXNudFN0cmluZyhlLmRhdGEpKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIHBheWxvYWQgPSB1bnBhY2tfcGF5bG9hZF8xLnVucGFja1BheWxvYWQoZSk7XG4gICAgaWYgKCFwYXlsb2FkKSB7XG4gICAgICAgIHJldHVybjtcbiAgICB9XG4gICAgdmFyIGRhdGEgPSBwYXlsb2FkLmV2ZW50RGF0YTtcbiAgICB2YXIgcmVwbHkgPSBwYXlsb2FkLnJlcGx5O1xuICAgIGRpc3BhdGNoXzEuZGlzcGF0Y2goXCIqXCIsIHBheWxvYWQuZXZlbnQsIGRhdGEsIHJlcGx5LCBlKTtcbiAgICBkaXNwYXRjaF8xLmRpc3BhdGNoKGUub3JpZ2luLCBwYXlsb2FkLmV2ZW50LCBkYXRhLCByZXBseSwgZSk7XG4gICAgYnJvYWRjYXN0X3RvX2NoaWxkX3dpbmRvd3NfMS5icm9hZGNhc3RUb0NoaWxkV2luZG93cyhlLmRhdGEsIHBheWxvYWQub3JpZ2luLCBlLnNvdXJjZSk7XG59XG5leHBvcnRzLm9ubWVzc2FnZSA9IG9ubWVzc2FnZTtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5wYWNrYWdlUGF5bG9hZCA9IHZvaWQgMDtcbnZhciBzdWJzY3JpYmVfcmVwbGllcl8xID0gcmVxdWlyZShcIi4vc3Vic2NyaWJlLXJlcGxpZXJcIik7XG52YXIgY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiLi9jb25zdGFudHNcIik7XG5mdW5jdGlvbiBwYWNrYWdlUGF5bG9hZChldmVudCwgb3JpZ2luLCBkYXRhLCByZXBseSkge1xuICAgIHZhciBwYWNrYWdlZDtcbiAgICB2YXIgcGF5bG9hZCA9IHtcbiAgICAgICAgZXZlbnQ6IGV2ZW50LFxuICAgICAgICBvcmlnaW46IG9yaWdpbixcbiAgICB9O1xuICAgIGlmICh0eXBlb2YgcmVwbHkgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBwYXlsb2FkLnJlcGx5ID0gc3Vic2NyaWJlX3JlcGxpZXJfMS5zdWJzY3JpYmVSZXBsaWVyKHJlcGx5LCBvcmlnaW4pO1xuICAgIH1cbiAgICBwYXlsb2FkLmV2ZW50RGF0YSA9IGRhdGE7XG4gICAgdHJ5IHtcbiAgICAgICAgcGFja2FnZWQgPSBjb25zdGFudHNfMS5wcmVmaXggKyBKU09OLnN0cmluZ2lmeShwYXlsb2FkKTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ291bGQgbm90IHN0cmluZ2lmeSBldmVudDogXCIgKyBlLm1lc3NhZ2UpO1xuICAgIH1cbiAgICByZXR1cm4gcGFja2FnZWQ7XG59XG5leHBvcnRzLnBhY2thZ2VQYXlsb2FkID0gcGFja2FnZVBheWxvYWQ7XG4iLCJcInVzZSBzdHJpY3RcIjtcbnZhciBfX2ltcG9ydERlZmF1bHQgPSAodGhpcyAmJiB0aGlzLl9faW1wb3J0RGVmYXVsdCkgfHwgZnVuY3Rpb24gKG1vZCkge1xuICAgIHJldHVybiAobW9kICYmIG1vZC5fX2VzTW9kdWxlKSA/IG1vZCA6IHsgXCJkZWZhdWx0XCI6IG1vZCB9O1xufTtcbk9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBcIl9fZXNNb2R1bGVcIiwgeyB2YWx1ZTogdHJ1ZSB9KTtcbmV4cG9ydHMuc3Vic2NyaWJlUmVwbGllciA9IHZvaWQgMDtcbnZhciBmcmFtZWJ1c18xID0gcmVxdWlyZShcIi4uL2ZyYW1lYnVzXCIpO1xudmFyIHV1aWRfMSA9IF9faW1wb3J0RGVmYXVsdChyZXF1aXJlKFwiQGJyYWludHJlZS91dWlkXCIpKTtcbmZ1bmN0aW9uIHN1YnNjcmliZVJlcGxpZXIoZm4sIG9yaWdpbikge1xuICAgIHZhciB1dWlkID0gdXVpZF8xLmRlZmF1bHQoKTtcbiAgICBmdW5jdGlvbiByZXBsaWVyKGRhdGEsIHJlcGx5T3JpZ2luSGFuZGxlcikge1xuICAgICAgICBmbihkYXRhLCByZXBseU9yaWdpbkhhbmRsZXIpO1xuICAgICAgICBmcmFtZWJ1c18xLkZyYW1lYnVzLnRhcmdldCh7XG4gICAgICAgICAgICBvcmlnaW46IG9yaWdpbixcbiAgICAgICAgfSkub2ZmKHV1aWQsIHJlcGxpZXIpO1xuICAgIH1cbiAgICBmcmFtZWJ1c18xLkZyYW1lYnVzLnRhcmdldCh7XG4gICAgICAgIG9yaWdpbjogb3JpZ2luLFxuICAgIH0pLm9uKHV1aWQsIHJlcGxpZXIpO1xuICAgIHJldHVybiB1dWlkO1xufVxuZXhwb3J0cy5zdWJzY3JpYmVSZXBsaWVyID0gc3Vic2NyaWJlUmVwbGllcjtcbiIsIlwidXNlIHN0cmljdFwiO1xuT2JqZWN0LmRlZmluZVByb3BlcnR5KGV4cG9ydHMsIFwiX19lc01vZHVsZVwiLCB7IHZhbHVlOiB0cnVlIH0pO1xuZXhwb3J0cy5zdWJzY3JpcHRpb25BcmdzSW52YWxpZCA9IHZvaWQgMDtcbnZhciBpc19ub3Rfc3RyaW5nXzEgPSByZXF1aXJlKFwiLi9pcy1ub3Qtc3RyaW5nXCIpO1xuZnVuY3Rpb24gc3Vic2NyaXB0aW9uQXJnc0ludmFsaWQoZXZlbnQsIGZuLCBvcmlnaW4pIHtcbiAgICBpZiAoaXNfbm90X3N0cmluZ18xLmlzbnRTdHJpbmcoZXZlbnQpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAodHlwZW9mIGZuICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBpc19ub3Rfc3RyaW5nXzEuaXNudFN0cmluZyhvcmlnaW4pO1xufVxuZXhwb3J0cy5zdWJzY3JpcHRpb25BcmdzSW52YWxpZCA9IHN1YnNjcmlwdGlvbkFyZ3NJbnZhbGlkO1xuIiwiXCJ1c2Ugc3RyaWN0XCI7XG5PYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgXCJfX2VzTW9kdWxlXCIsIHsgdmFsdWU6IHRydWUgfSk7XG5leHBvcnRzLnVucGFja1BheWxvYWQgPSB2b2lkIDA7XG52YXIgY29uc3RhbnRzXzEgPSByZXF1aXJlKFwiLi9jb25zdGFudHNcIik7XG52YXIgcGFja2FnZV9wYXlsb2FkXzEgPSByZXF1aXJlKFwiLi9wYWNrYWdlLXBheWxvYWRcIik7XG5mdW5jdGlvbiB1bnBhY2tQYXlsb2FkKGUpIHtcbiAgICB2YXIgcGF5bG9hZDtcbiAgICBpZiAoZS5kYXRhLnNsaWNlKDAsIGNvbnN0YW50c18xLnByZWZpeC5sZW5ndGgpICE9PSBjb25zdGFudHNfMS5wcmVmaXgpIHtcbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICBwYXlsb2FkID0gSlNPTi5wYXJzZShlLmRhdGEuc2xpY2UoY29uc3RhbnRzXzEucHJlZml4Lmxlbmd0aCkpO1xuICAgIH1cbiAgICBjYXRjaCAoZXJyKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgaWYgKHBheWxvYWQucmVwbHkpIHtcbiAgICAgICAgdmFyIHJlcGx5T3JpZ2luXzEgPSBlLm9yaWdpbjtcbiAgICAgICAgdmFyIHJlcGx5U291cmNlXzEgPSBlLnNvdXJjZTtcbiAgICAgICAgdmFyIHJlcGx5RXZlbnRfMSA9IHBheWxvYWQucmVwbHk7XG4gICAgICAgIHBheWxvYWQucmVwbHkgPSBmdW5jdGlvbiByZXBseShyZXBseURhdGEpIHtcbiAgICAgICAgICAgIGlmICghcmVwbHlTb3VyY2VfMSkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciByZXBseVBheWxvYWQgPSBwYWNrYWdlX3BheWxvYWRfMS5wYWNrYWdlUGF5bG9hZChyZXBseUV2ZW50XzEsIHJlcGx5T3JpZ2luXzEsIHJlcGx5RGF0YSk7XG4gICAgICAgICAgICBpZiAoIXJlcGx5UGF5bG9hZCkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJlcGx5U291cmNlXzEucG9zdE1lc3NhZ2UocmVwbHlQYXlsb2FkLCByZXBseU9yaWdpbl8xKTtcbiAgICAgICAgfTtcbiAgICB9XG4gICAgcmV0dXJuIHBheWxvYWQ7XG59XG5leHBvcnRzLnVucGFja1BheWxvYWQgPSB1bnBhY2tQYXlsb2FkO1xuIiwiLy8gVGhlIG1vZHVsZSBjYWNoZVxudmFyIF9fd2VicGFja19tb2R1bGVfY2FjaGVfXyA9IHt9O1xuXG4vLyBUaGUgcmVxdWlyZSBmdW5jdGlvblxuZnVuY3Rpb24gX193ZWJwYWNrX3JlcXVpcmVfXyhtb2R1bGVJZCkge1xuXHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcblx0aWYoX193ZWJwYWNrX21vZHVsZV9jYWNoZV9fW21vZHVsZUlkXSkge1xuXHRcdHJldHVybiBfX3dlYnBhY2tfbW9kdWxlX2NhY2hlX19bbW9kdWxlSWRdLmV4cG9ydHM7XG5cdH1cblx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcblx0dmFyIG1vZHVsZSA9IF9fd2VicGFja19tb2R1bGVfY2FjaGVfX1ttb2R1bGVJZF0gPSB7XG5cdFx0Ly8gbm8gbW9kdWxlLmlkIG5lZWRlZFxuXHRcdC8vIG5vIG1vZHVsZS5sb2FkZWQgbmVlZGVkXG5cdFx0ZXhwb3J0czoge31cblx0fTtcblxuXHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cblx0X193ZWJwYWNrX21vZHVsZXNfX1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cblx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcblx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xufVxuXG4iLCIvLyBzdGFydHVwXG4vLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbi8vIFRoaXMgZW50cnkgbW9kdWxlIGlzIHJlZmVyZW5jZWQgYnkgb3RoZXIgbW9kdWxlcyBzbyBpdCBjYW4ndCBiZSBpbmxpbmVkXG52YXIgX193ZWJwYWNrX2V4cG9ydHNfXyA9IF9fd2VicGFja19yZXF1aXJlX18oXCIuL3NyYy9pbmRleC50c1wiKTtcbiJdLCJzb3VyY2VSb290IjoiIn0=
