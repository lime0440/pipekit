(() => {
    const STATE_CLASSNAME_PREFIX = '!';

    const __Events = Object.freeze({
        VARIANT_UPDATE: 'variant:update',
        VARIANT_CHANGE: 'variant:change',
        VARIANT_LOADING: 'variant:loading',
        CART_ADD: 'cart:add',
        CART_ADD_FEATURE: 'cart:add-feature',
        CART_CHANGE: 'cart:change',
        CART_UPDATE: 'cart:update',
        CART_DRAWER_MUTE: 'cart-drawer:mute',
        CART_REGISTER: 'cart:register',
        CART_ERROR: 'cart:error',
        CART_NOTIFICATIONS_ENABLING: 'cart:notififications-enable',
        CART_REPLACE: 'cart:replace',
        // CART_SAVED_ITEMS_CHANGE: 'cart-saves:change',
        COLLECTION_LOADING: 'collection:loading',
        COLLECTION_CHANGE: 'collection:change',
        COLLECTION_UPDATE: 'collection:update',
        COLLECTION_FILTER_CHANGE: 'filter:change',
        COLLECTION_NAVIGATION_CHANGE: 'navigation:change',
        COLLECTION_UPDATED: 'collection_updated',
        COLLECTION_VIEW_CHANGE: 'collection:view-change',
        PRODUCT_GALLERY_SLIDE_CHANGE: 'product-gallery:slide-change',
        PRODUCT_GALLERY_EXPAND_CHANGE: 'product-gallery:expand-change',
        TOAST_NOTIFICATION: 'toast-notification:open',
        UPSELL_PRODUCTS_CHANGE: 'upsell-products:change',
        BROWSING_HISTORY_LOAD: 'browsing-history:load',
        RECOMMENDATIONS_LOADED: 'recommendations:loaded',
        SELLING_PLAN_CHANGE: 'selling-plan:change',
        HEADER_UPDATE: 'header:nav-update',
        HEADER_TOOLBAR_UPDATE: 'header:nav-toolbar-update',
        PRODUCT_BUNDLE_VARIANT_CHANGE: 'variant-selector-modal:change',
        PRODUCT_FORM_SUBMIT: 'product-form:submit'
    })

    const __MediaQueries = Object.freeze({
        MOBILE: window.matchMedia('(max-width:  991px)'),
        DESKTOP: window.matchMedia('(min-width: 992px)')
    })

    const __DomEvents = Object.freeze({
        MODAL_CLOSE: new CustomEvent('modal-close', {
            bubbles: true
        }),
        MODAL_OPEN: new CustomEvent('modal-open', {
            bubbles: true
        })
    })

    const __StoreConfig = Object.freeze({
        'browsingHistory': {
            type: Array,
            storage: 'local',
            limit: 10
        },
        // 'wishlist': {
        //     type: Array,
        //     storage: 'local'
        // },
        // 'cartSaved': {
        //     type: Array,
        //     storage: 'local'
        // },
        'newsletter': {
            type: Number,
            storage: 'local'
        },
        'close-annoncement': {
            type: Boolean,
            storage: 'session'
        },
        'age-confirm': {
            type: Boolean,
            storage: 'local'
        },
        'collection-horizontal-view': {
            type: Number,
            storage: 'local'
        }
    })

    let componentCounter = 0;

    // TODO: move error handling to proxy
    class __Store {
        static errors = {
            missingStore(key) {
                return new Error(`store ${key} does not exists`);
            },
            setArray(key) {
                return new Error(`can't set value ${key} for Array type use add instead`)
            },
            notAnArray(key) {
                return new Error(`${key} is not an array`)
            }
        }
        constructor() {
            this._store = new Map();
            Object.entries(__StoreConfig).map(([ storeKey, options ]) => {
                const storage = window[`${options.storage}Storage`];
                const value = storage.getItem(storeKey);
                const type = options.type;
                this._store.set(storeKey, {
                    type,
                    storage,
                    limit: options.limit,
                    data: type === Array 
                        ? new Set(value ? JSON.parse(value): []) 
                        : value && type(value)
                })
            })
        }
        add(key, value) {
            try {
                const storeTarget = this._store.get(key);

                if(!storeTarget) {
                    throw __Store.errors.missingStore(key);
                } 

                if(storeTarget.type !== Array) {
                    throw __Store.errors.notAnArray(key);
                }

                this._handleStoreLimit(storeTarget);
                storeTarget.data.add(value);
                this._sync(key);
            } catch(e) {
                console.error(e);
            }
        }
        _handleStoreLimit(storeTarget) {
            if(storeTarget.limit) {
                let offset = storeTarget.limit - storeTarget.data.size;
                const values = storeTarget.data.values();
                while(offset <= 0) {
                    let current = values.next();
                    storeTarget.data.delete(current.value);
                    offset++;
                }
            }
        }
        set(key, value) {
            try {
                const storeTarget = this._store.get(key);

                if(!storeTarget) {
                    throw __Store.errors.missingStore(key);
                }

                if(storeTarget.type === Array) {
                    throw __Store.errors.setArray(key);
                }

                storeTarget.data = value;
                this._sync(key);
            } catch(e) {
                console.error(e.message);
            }
        }
        get(key) {
            try {
                const storeTarget = this._store.get(key);

                if(!storeTarget) {
                    throw __Store.errors.missingStore(key);
                }

                if(storeTarget.data === null) {
                    return null;
                }

                return storeTarget.type === Array
                    ? Array.from(storeTarget.data)
                    : storeTarget.type(storeTarget.data);

            } catch(e) {
                console.error(e);
            }
        }

        has(key, value) {
            try {
                const storeTarget = this._store.get(key);
                if(!storeTarget) {
                    throw __Store.errors.missingStore(key);
                }
                if(storeTarget.type !== Array) {
                    throw __Store.errors.notAnArray(key);
                }
                return storeTarget.data.has(value);
            } catch (e) {
                console.error(e);
            }
        }

        remove(key, value) {
            try {
                const storeTarget = this._store.get(key);
                if(!storeTarget) {
                    throw __Store.errors.missingStore(key);
                }
                if(storeTarget.type === Array) {
                    storeTarget.data.delete(value);
                } else {
                    storeTarget.value = null;
                }
                this._sync(key);
            } catch(e) {
                console.error(e);
            }
        }

        _sync(key) {
            // none-blocking storage write
            setTimeout(() => {
                const target = this._store.get(key);
                target.storage.setItem(key, target.type === Array ? JSON.stringify(Array.from(target.data)) : target.data);
            }, 20);
        }
    }

    class __PubSub {
        constructor() {
            this._subs = new Map();
        }
        subscribe(event, callback, options, sig) {
            if(!this._subs.has(event)) {
                this._subs.set(event, new Set());
            }
            const sub = {
                callback,
                sectionId: options.sectionId,
                once: options.once,
                global: options.global,
                sig
            }
            this._subs.get(event).add(sub);
            return sub;
        }
        unsubscribe(event, sub) {
            if(this._subs.has(event)) {
                this._subs.get(event)?.delete(sub);
            }
        }
        publish(event, data, sectionId, sig) {
            if(this._subs.has(event)) {
                this._subs.get(event).forEach(sub => {
                    const isSelfPublish = sub.sig === sig; // avoid circular publishing
                    const isGlobalOrSection = sub.sectionId === sectionId || sub.global; 
                    if(isGlobalOrSection && !isSelfPublish) {
                        sub.callback(data);
                        if(sub.once) {
                            this.unsubscribe(event, sub);
                        }
                    }
                });
            }
        }
    }

    const pubSub = new __PubSub();

    class __Cache {
        constructor() {
            this._cache = new Map();
        }
        set(key, value) {
            this._cache.set(key, value);
        }
        get(key) {
            return this._cache.get(key);
        }
        has(key) {
            return this._cache.has(key);
        }
        delete(key) {
            this._cache.delete(key);
        }
        clear() {
            this._cache.clear();
        }
    }

    const __Utils = Object.freeze({
        isFunction: (x) => {
            return Object.prototype.toString.call(x) == '[object Function]';
        },
        debounce: (fn, wait) => {
            let t;
            return (...args) => {
                clearTimeout(t);
                t = setTimeout(() => fn.apply(this, args), wait);
            }
        },
        parseHTML: (text) => {
            return new DOMParser().parseFromString(text, 'text/html');
        },
        fetchHTML: (URL) => {
            return fetch(URL)
                .then(res => res.text())
                .then(text => __Utils.parseHTML(text))
                .catch(e => console.error(e));
        },
        $active: (el, state = true) => {
            __Utils.$state(el, 'active', state);
        },
        $loading: (el, state = true) => {
            __Utils.$state(el, 'loading', state);
        },
        $state: (el, name, state = true) => {
            el.classList.toggle(`${STATE_CLASSNAME_PREFIX}${name}`, state)
        },
        $fetch: async (URL, options) => {
            try {
                if(__Utils.isFunction(options?.before)) {
                    options.before();
                }

                let [cleanURL, existedParams] = URL.split('?');

                let params = '';
                if(options?.params || options.sectionId) {
                    params = !!(options.params instanceof URLSearchParams)
                        ? options.params
                        : new URLSearchParams(options.params || '');
                    
                    if(options.sectionId) {
                        params.append('section_id', options.sectionId);
                    }

                    params = params.toString();
                }


                // TODO: this logic should be refactored ASAP
                params = [existedParams, params]
                    .filter(Boolean)
                    .join('&');

                if(params) {
                    params = `?${params}`;
                }

                const res = await fetch(`${cleanURL}${params}`);
                if(options?.nullOn404 && res.status === 404) {
                    if(__Utils.isFunction(options?.after)) {
                        options.after();
                    }
                    return null;
                }
                const doc = await res.text();
                if(__Utils.isFunction(options?.after)) {
                    options.after();
                }
                const $doc = __Utils.parseHTML(doc); 
                return options?.selectAll ? 
                    Array.from($doc.querySelectorAll(options.selectAll)) : 
                    options?.select ? $doc.querySelector(options.select) : $doc;

            } catch (error) {
                console.error(error);
                if(__Utils.isFunction(options?.after)) {
                    options.after();
                }
            }
        },
        $hide: (el) => {
            el.setAttribute('hidden', '');
        },
        $show: (el) => {
            el.removeAttribute('hidden');
        },
        $classListTemp: (element, className, time = 1000) => {
            element.classList.add(className);
            setTimeout(() => element.classList.remove(className), time)
        },
        $isEmpty: (el) => {
            if(!el) {
                return;
            }
            if(el.content) {
                el = el.content;
            }
            return el.textContent.trim() === '';
        },
        $isHidden: el => el.hasAttribute('hidden'),
        $clone: el => {
            if(el.content) {
                return el.content.cloneNode(true);
            }
            return el.cloneNode(true);
        },
        $isEqual: (a, b) => a.isEqualNode(b),
        $toggleDisplay: (el, state) => {
            if(state === undefined) {
                __Utils.$isHidden(el) ? __Utils.$show(el) : __Utils.$hide(el);
                return;
            }

            state ? __Utils.$show(el) : __Utils.$hide(el);
        },
        $replaceContent: (from, to) => {
            const target = to.content || to;
            if(!__Utils.$isEqual(from, target)) {
                from.replaceChildren(...target.cloneNode(true).childNodes);
            }
        },
        $JSON : el => JSON.parse(el.textContent)
    });

    class __CoreComponent extends HTMLElement {
        constructor() {
            super();
            this.sectionId = this.getAttribute('section-id');
            this._elements = new Map();
            this._props = new Map();
            this._subs = new Map();
            this._$parentSection = null;
            this.__sig = `${this.tagName}-${componentCounter}`;
            componentCounter++; 
        }
        connectedCallback() {
            this._handleElements();
            if(!this.sectionId) {
                console.warn(`section-id not found in <${this.tagName.toLocaleLowerCase()}> component`);
            }
            if(__Utils.isFunction(this.render)) {
                this.render();
            }
        }
        _handleElements() {
            
            if(!this.elements) {
                return;
            }

            if(this.elements.$ && Array.isArray(this.elements.$)) {
                this.elements.$.map(el => {
                    this.elements[el] = Array.isArray(el) ? [`[data-element="${el}"]`] : `[data-element="${el}"]`;
                })
                delete this.elements.$;
            }

            for(const [key, value] of Object.entries(this.elements)) {
                if(key.startsWith('$') && value === true) {
                    this.elements[key.substr(1)] = key;
                    delete this.elements[key];
                }
            }
        }
        _setElementEvents(el, events) {
            const eventsMap = new Map();
            Object.entries(events).map(([event, callback]) => {
                callback = callback.bind(this);
                eventsMap.set(event, callback);
                if(Array.isArray(el)) {
                    el.forEach(el => {
                        el.addEventListener(event, callback);
                    })
                } else {
                    el.addEventListener(event, callback);
                }
            });
            return eventsMap;
        }
        $(el, events) {
            if(typeof el === 'object') {
                this._elements.set('__root__', {
                    node: this,
                    events: this._setElementEvents(this, el)
                })
                return;
            }

            const selector = this.elements[el];

            if(!selector) {
                console.error(`element ${el} not found in <${this.tagName.toLocaleLowerCase()}>`);
                return;
            }

            if(this._elements.has(el) && this._elements.get(el).node.isConnected === false) {
                this.$remove(el);
            }

            if(!this._elements.has(el)) {
                let elEvents = null;

                const node = this._selectElement(selector);
                
                if(!node) {
                    return null;
                }

                if(typeof events === 'object' && node) {
                    elEvents = this._setElementEvents(node, events);
                }

                this._elements.set(el, {
                    node,
                    events: elEvents
                });
            }

            return this._elements.get(el).node;
        }

        $remove(el) {
            if(!this._elements.has(el)) {
                return;
            }
            this._clearElementEvents(this._elements.get(el));
            this._elements.get(el).node.remove();
            this._elements.get(el).node = null;
            this._elements.delete(el);
        }

        _selectElement(selector) {
            if(Array.isArray(selector)) {
                return Array.from(this.querySelectorAll(this._parseSelector(selector[0])));
            }
            return this.querySelector(this._parseSelector(selector));
        }
        _parseSelector(selector) {
            if(selector.startsWith('$')) {
                return `[data-element="${selector.substr(1)}"]`
            }
            return selector;
        }
        prop(name) {
            const valueType = this.propTypes[name];
            if(!valueType) {
                console.error(`prop ${name} not found in <${this.tagName.toLocaleLowerCase()}>`);
                return;
            }
            if(!this._props.has(name)) {
                this._props.set(name, 
                    valueType === Number ? Number(this.getAttribute(name)) :
                    valueType === Boolean ? this.hasAttribute(name) :
                    this.getAttribute(name)
                )
            }
            return this._props.get(name);
        }
        setProp(name, value='') {
            this.prop(name);
            if(!this._props.has(name)) {
                console.warn(`prop ${name} does not exists in ${this.tagName}`);
                return;
            }
            this.setAttribute(name, value);
            this._props.set(name, value);
        }
        sub(event, callback, options) {
            if(!this.sectionId) {
                console.warn(`section-id not found in <${this.tagName.toLocaleLowerCase()}> component subscription for '${event}' will be ignored`);
                return;
            }
            callback = callback.bind(this);
            if(!this._subs.has(event)) {
                const sub = pubSub.subscribe(event, callback, {
                    sectionId: this.sectionId,
                    ...options
                }, this.__sig);
                this._subs.set(event, sub);
            }
        }
        unsub(event) {
            if(this._subs.has(event)) {
                const sub = this._subs.get(event);
                this._subs.delete(event);
                pubSub.unsubscribe(event, sub);
            }
        }
        pub(event, data) {
            pubSub.publish(event, data, this.sectionId, this.__sig);
        }

        _clearElementEvents(el) {
            const { node, events } = el;

            if(node && events) {
                events.forEach((callback, event) => {
                    if(Array.isArray(node)) {
                        node.forEach(n => {
                            n.removeEventListener(event, callback);
                        })
                    } else {
                        node.removeEventListener(event, callback);
                    }
                    events.delete(event);
                })
            }

        }

        updateContentFrom(doc) {
            if(!this.id) {
                console.error(`<${this.tagName}> must have unique id to update the content`);
                return;
            }
            const foreign = doc.getElementById(this.id);
            if(!foreign) {
                console.error(`provided content does not contain the same id as <${this.tagName}>`);
                return;
            }
            __Utils.$replaceContent(this, foreign);
        }

        disconnectedCallback() {
            this._subs.forEach((sub, event) => {
                this.unsub(event, sub);
            });
            this._elements.forEach(this._clearElementEvents.bind(this));
            this._elements.clear();
            if(__Utils.isFunction(this.destroy)) {
                this.destroy();
            };
        }

        get $section() {
            if(!this._$parentSection) {
                this._$parentSection = document.getElementById(`shopify-section-${this.sectionId}`);
            }
            return this._$parentSection;
        }
    }

    window.Global = Object.freeze({
        Core: __CoreComponent,
        Utils: __Utils,
        Events: __Events,
        DOMEvents: __DomEvents,
        Cache: new __Cache(),
        Store: new __Store(),
        MediaQueries: __MediaQueries,
        onBlazeLoad: (callback) => {
            if(window.BlazeSlider) {
                callback();
            } else {
                document.addEventListener('blaze-loaded', callback, { once: true })
            }
        },
        onPlyrLoad: (callback) => {
            if(window.Plyr) {
                callback();
            } else {
                document.addEventListener('plyr-loaded', callback, { once: true })
            }
        }
    })
})()
