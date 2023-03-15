
(function(l, r) { if (!l || l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (self.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(self.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    let src_url_equal_anchor;
    function src_url_equal(element_src, url) {
        if (!src_url_equal_anchor) {
            src_url_equal_anchor = document.createElement('a');
        }
        src_url_equal_anchor.href = url;
        return element_src === src_url_equal_anchor.href;
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }
    function null_to_empty(value) {
        return value == null ? '' : value;
    }
    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        if (node.parentNode) {
            node.parentNode.removeChild(node);
        }
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        input.value = value == null ? '' : value;
    }
    function custom_event(type, detail, { bubbles = false, cancelable = false } = {}) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, bubbles, cancelable, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    let render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = /* @__PURE__ */ Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    // flush() calls callbacks in this order:
    // 1. All beforeUpdate callbacks, in order: parents before children
    // 2. All bind:this callbacks, in reverse order: children before parents.
    // 3. All afterUpdate callbacks, in order: parents before children. EXCEPT
    //    for afterUpdates called during the initial onMount, which are called in
    //    reverse order: children before parents.
    // Since callbacks might update component values, which could trigger another
    // call to flush(), the following steps guard against this:
    // 1. During beforeUpdate, any updated components will be added to the
    //    dirty_components array and will cause a reentrant call to flush(). Because
    //    the flush index is kept outside the function, the reentrant call will pick
    //    up where the earlier call left off and go through all dirty components. The
    //    current_component value is saved and restored so that the reentrant call will
    //    not interfere with the "parent" flush() call.
    // 2. bind:this callbacks cannot trigger new flush() calls.
    // 3. During afterUpdate, any updated components will NOT have their afterUpdate
    //    callback called a second time; the seen_callbacks set, outside the flush()
    //    function, guarantees this behavior.
    const seen_callbacks = new Set();
    let flushidx = 0; // Do *not* move this inside the flush() function
    function flush() {
        // Do not reenter flush while dirty components are updated, as this can
        // result in an infinite loop. Instead, let the inner flush handle it.
        // Reentrancy is ok afterwards for bindings etc.
        if (flushidx !== 0) {
            return;
        }
        const saved_component = current_component;
        do {
            // first, call beforeUpdate functions
            // and update components
            try {
                while (flushidx < dirty_components.length) {
                    const component = dirty_components[flushidx];
                    flushidx++;
                    set_current_component(component);
                    update(component.$$);
                }
            }
            catch (e) {
                // reset dirty state to not end up in a deadlocked state and then rethrow
                dirty_components.length = 0;
                flushidx = 0;
                throw e;
            }
            set_current_component(null);
            dirty_components.length = 0;
            flushidx = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
        set_current_component(saved_component);
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    /**
     * Useful for example to execute remaining `afterUpdate` callbacks before executing `destroy`.
     */
    function flush_render_callbacks(fns) {
        const filtered = [];
        const targets = [];
        render_callbacks.forEach((c) => fns.indexOf(c) === -1 ? filtered.push(c) : targets.push(c));
        targets.forEach((c) => c());
        render_callbacks = filtered;
    }
    const outroing = new Set();
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function mount_component(component, target, anchor, customElement) {
        const { fragment, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        if (!customElement) {
            // onMount happens before the initial afterUpdate
            add_render_callback(() => {
                const new_on_destroy = component.$$.on_mount.map(run).filter(is_function);
                // if the component was destroyed immediately
                // it will update the `$$.on_destroy` reference to `null`.
                // the destructured on_destroy may still reference to the old array
                if (component.$$.on_destroy) {
                    component.$$.on_destroy.push(...new_on_destroy);
                }
                else {
                    // Edge case - component was destroyed immediately,
                    // most likely as a result of a binding initialising
                    run_all(new_on_destroy);
                }
                component.$$.on_mount = [];
            });
        }
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            flush_render_callbacks($$.after_update);
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, append_styles, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const $$ = component.$$ = {
            fragment: null,
            ctx: [],
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            on_disconnect: [],
            before_update: [],
            after_update: [],
            context: new Map(options.context || (parent_component ? parent_component.$$.context : [])),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false,
            root: options.target || parent_component.$$.root
        };
        append_styles && append_styles($$.root);
        let ready = false;
        $$.ctx = instance
            ? instance(component, options.props || {}, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor, options.customElement);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            if (!is_function(callback)) {
                return noop;
            }
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.56.0' }, detail), { bubbles: true }));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation, has_stop_immediate_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        if (has_stop_immediate_propagation)
            modifiers.push('stopImmediatePropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    /* src\App.svelte generated by Svelte v3.56.0 */

    const file = "src\\App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[14] = list[i];
    	child_ctx[16] = i;
    	return child_ctx;
    }

    // (189:6) {#if todo.status=='pending'}
    function create_if_block_3(ctx) {
    	let div1;
    	let div0;
    	let t0_value = /*todo*/ ctx[14].task + "";
    	let t0;
    	let t1;
    	let button;
    	let t2;
    	let button_class_value;
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler_3() {
    		return /*click_handler_3*/ ctx[10](/*i*/ ctx[16]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			t2 = text("✔");
    			t3 = space();
    			attr_dev(div0, "class", "svelte-gyjtjx");
    			add_location(div0, file, 190, 8, 3131);
    			attr_dev(button, "class", button_class_value = "" + (null_to_empty(/*todo*/ ctx[14].status == 'completed' ? 'active' : '') + " svelte-gyjtjx"));
    			add_location(button, file, 193, 8, 3181);
    			attr_dev(div1, "class", "task svelte-gyjtjx");
    			add_location(div1, file, 189, 7, 3104);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, button);
    			append_dev(button, t2);
    			append_dev(div1, t3);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_3, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*todos*/ 1 && t0_value !== (t0_value = /*todo*/ ctx[14].task + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*todos*/ 1 && button_class_value !== (button_class_value = "" + (null_to_empty(/*todo*/ ctx[14].status == 'completed' ? 'active' : '') + " svelte-gyjtjx"))) {
    				attr_dev(button, "class", button_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_3.name,
    		type: "if",
    		source: "(189:6) {#if todo.status=='pending'}",
    		ctx
    	});

    	return block;
    }

    // (177:35) 
    function create_if_block_1(ctx) {
    	let if_block_anchor;
    	let if_block = /*todo*/ ctx[14].status == 'completed' && create_if_block_2(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (/*todo*/ ctx[14].status == 'completed') {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block_2(ctx);
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) if_block.d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_1.name,
    		type: "if",
    		source: "(177:35) ",
    		ctx
    	});

    	return block;
    }

    // (165:5) {#if filter=='all'}
    function create_if_block(ctx) {
    	let div1;
    	let div0;
    	let t0_value = /*todo*/ ctx[14].task + "";
    	let t0;
    	let t1;
    	let button0;
    	let t2;
    	let button0_class_value;
    	let t3;
    	let button1;
    	let t5;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[7](/*i*/ ctx[16]);
    	}

    	function click_handler_1() {
    		return /*click_handler_1*/ ctx[8](/*i*/ ctx[16]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			button0 = element("button");
    			t2 = text("✔");
    			t3 = space();
    			button1 = element("button");
    			button1.textContent = "✖";
    			t5 = space();
    			attr_dev(div0, "class", "svelte-gyjtjx");
    			add_location(div0, file, 166, 7, 2526);
    			attr_dev(button0, "class", button0_class_value = "" + (null_to_empty(/*todo*/ ctx[14].status == 'completed' ? 'active' : '') + " svelte-gyjtjx"));
    			add_location(button0, file, 169, 7, 2573);
    			attr_dev(button1, "class", "svelte-gyjtjx");
    			add_location(button1, file, 172, 7, 2703);
    			attr_dev(div1, "class", "task svelte-gyjtjx");
    			add_location(div1, file, 165, 6, 2500);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, button0);
    			append_dev(button0, t2);
    			append_dev(div1, t3);
    			append_dev(div1, button1);
    			append_dev(div1, t5);

    			if (!mounted) {
    				dispose = [
    					listen_dev(button0, "click", click_handler, false, false, false, false),
    					listen_dev(button1, "click", click_handler_1, false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*todos*/ 1 && t0_value !== (t0_value = /*todo*/ ctx[14].task + "")) set_data_dev(t0, t0_value);

    			if (dirty & /*todos*/ 1 && button0_class_value !== (button0_class_value = "" + (null_to_empty(/*todo*/ ctx[14].status == 'completed' ? 'active' : '') + " svelte-gyjtjx"))) {
    				attr_dev(button0, "class", button0_class_value);
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(165:5) {#if filter=='all'}",
    		ctx
    	});

    	return block;
    }

    // (178:6) {#if todo.status=='completed'}
    function create_if_block_2(ctx) {
    	let div1;
    	let div0;
    	let t0_value = /*todo*/ ctx[14].task + "";
    	let t0;
    	let t1;
    	let button;
    	let t3;
    	let mounted;
    	let dispose;

    	function click_handler_2() {
    		return /*click_handler_2*/ ctx[9](/*i*/ ctx[16]);
    	}

    	const block = {
    		c: function create() {
    			div1 = element("div");
    			div0 = element("div");
    			t0 = text(t0_value);
    			t1 = space();
    			button = element("button");
    			button.textContent = "✖";
    			t3 = space();
    			attr_dev(div0, "class", "svelte-gyjtjx");
    			add_location(div0, file, 179, 8, 2897);
    			attr_dev(button, "class", "svelte-gyjtjx");
    			add_location(button, file, 182, 8, 2947);
    			attr_dev(div1, "class", "task svelte-gyjtjx");
    			add_location(div1, file, 178, 7, 2870);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, div1, anchor);
    			append_dev(div1, div0);
    			append_dev(div0, t0);
    			append_dev(div1, t1);
    			append_dev(div1, button);
    			append_dev(div1, t3);

    			if (!mounted) {
    				dispose = listen_dev(button, "click", click_handler_2, false, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*todos*/ 1 && t0_value !== (t0_value = /*todo*/ ctx[14].task + "")) set_data_dev(t0, t0_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(div1);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block_2.name,
    		type: "if",
    		source: "(178:6) {#if todo.status=='completed'}",
    		ctx
    	});

    	return block;
    }

    // (164:4) {#each todos as todo, i}
    function create_each_block(ctx) {
    	let if_block_anchor;

    	function select_block_type(ctx, dirty) {
    		if (/*filter*/ ctx[2] == 'all') return create_if_block;
    		if (/*filter*/ ctx[2] == 'completed') return create_if_block_1;
    		if (/*todo*/ ctx[14].status == 'pending') return create_if_block_3;
    	}

    	let current_block_type = select_block_type(ctx);
    	let if_block = current_block_type && current_block_type(ctx);

    	const block = {
    		c: function create() {
    			if (if_block) if_block.c();
    			if_block_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			if (if_block) if_block.m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    		},
    		p: function update(ctx, dirty) {
    			if (current_block_type === (current_block_type = select_block_type(ctx)) && if_block) {
    				if_block.p(ctx, dirty);
    			} else {
    				if (if_block) if_block.d(1);
    				if_block = current_block_type && current_block_type(ctx);

    				if (if_block) {
    					if_block.c();
    					if_block.m(if_block_anchor.parentNode, if_block_anchor);
    				}
    			}
    		},
    		d: function destroy(detaching) {
    			if (if_block) {
    				if_block.d(detaching);
    			}

    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(164:4) {#each todos as todo, i}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let header;
    	let h1;
    	let t1;
    	let h4;
    	let t3;
    	let div4;
    	let div3;
    	let div0;
    	let input;
    	let t4;
    	let button0;
    	let t6;
    	let div1;
    	let t7;
    	let div2;
    	let button1;
    	let t8;
    	let button1_class_value;
    	let t9;
    	let button2;
    	let t10;
    	let button2_class_value;
    	let t11;
    	let button3;
    	let t12;
    	let button3_class_value;
    	let t13;
    	let footer;
    	let p;
    	let t14;
    	let a0;
    	let t16;
    	let img;
    	let img_src_value;
    	let t17;
    	let a1;
    	let mounted;
    	let dispose;
    	let each_value = /*todos*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			header = element("header");
    			h1 = element("h1");
    			h1.textContent = "Dosu - Tasks";
    			t1 = space();
    			h4 = element("h4");
    			h4.textContent = "Task Manager / Productivity Web App";
    			t3 = space();
    			div4 = element("div");
    			div3 = element("div");
    			div0 = element("div");
    			input = element("input");
    			t4 = space();
    			button0 = element("button");
    			button0.textContent = "Add";
    			t6 = space();
    			div1 = element("div");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t7 = space();
    			div2 = element("div");
    			button1 = element("button");
    			t8 = text("All");
    			t9 = space();
    			button2 = element("button");
    			t10 = text("Completed");
    			t11 = space();
    			button3 = element("button");
    			t12 = text("Incomplete");
    			t13 = space();
    			footer = element("footer");
    			p = element("p");
    			t14 = text("Made with ");
    			a0 = element("a");
    			a0.textContent = "Svelte.js";
    			t16 = space();
    			img = element("img");
    			t17 = text(" by ");
    			a1 = element("a");
    			a1.textContent = "Emmanuel Oladosu";
    			attr_dev(h1, "class", "svelte-gyjtjx");
    			add_location(h1, file, 153, 9, 2165);
    			attr_dev(h4, "class", "svelte-gyjtjx");
    			add_location(h4, file, 153, 31, 2187);
    			attr_dev(header, "class", "svelte-gyjtjx");
    			add_location(header, file, 153, 1, 2157);
    			attr_dev(input, "type", "text");
    			attr_dev(input, "class", "svelte-gyjtjx");
    			add_location(input, file, 157, 4, 2313);
    			attr_dev(button0, "class", "svelte-gyjtjx");
    			add_location(button0, file, 158, 4, 2356);
    			attr_dev(div0, "class", "form svelte-gyjtjx");
    			add_location(div0, file, 156, 3, 2290);
    			attr_dev(div1, "class", "tasks svelte-gyjtjx");
    			add_location(div1, file, 162, 3, 2420);
    			attr_dev(button1, "class", button1_class_value = "" + (null_to_empty(/*filter*/ ctx[2] == 'all' ? 'active' : '') + " svelte-gyjtjx"));
    			add_location(button1, file, 202, 4, 3394);
    			attr_dev(button2, "class", button2_class_value = "" + (null_to_empty(/*filter*/ ctx[2] == 'completed' ? 'active' : '') + " svelte-gyjtjx"));
    			add_location(button2, file, 205, 4, 3496);
    			attr_dev(button3, "class", button3_class_value = "" + (null_to_empty(/*filter*/ ctx[2] == 'incomplete' ? 'active' : '') + " svelte-gyjtjx"));
    			add_location(button3, file, 208, 4, 3616);
    			attr_dev(div2, "class", "filters svelte-gyjtjx");
    			add_location(div2, file, 201, 3, 3368);
    			attr_dev(div3, "class", "todo svelte-gyjtjx");
    			add_location(div3, file, 155, 2, 2268);
    			attr_dev(div4, "class", "container svelte-gyjtjx");
    			add_location(div4, file, 154, 1, 2242);
    			attr_dev(a0, "href", "https://svelte.dev/");
    			attr_dev(a0, "class", "svelte-gyjtjx");
    			add_location(a0, file, 216, 12, 3790);
    			if (!src_url_equal(img.src, img_src_value = "https://th.bing.com/th/id/R.02f9ec2d33cc2727b182b07e53a35773?rik=sB8nh4ElbxLn7g&pid=ImgRaw&r=0")) attr_dev(img, "src", img_src_value);
    			attr_dev(img, "alt", "");
    			attr_dev(img, "class", "svelte-gyjtjx");
    			add_location(img, file, 216, 58, 3836);
    			attr_dev(a1, "href", "https://emmanueloladosu.com/");
    			attr_dev(a1, "class", "svelte-gyjtjx");
    			add_location(a1, file, 216, 175, 3953);
    			add_location(p, file, 215, 2, 3774);
    			attr_dev(footer, "class", "svelte-gyjtjx");
    			add_location(footer, file, 214, 1, 3763);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, header, anchor);
    			append_dev(header, h1);
    			append_dev(header, t1);
    			append_dev(header, h4);
    			insert_dev(target, t3, anchor);
    			insert_dev(target, div4, anchor);
    			append_dev(div4, div3);
    			append_dev(div3, div0);
    			append_dev(div0, input);
    			set_input_value(input, /*task*/ ctx[1]);
    			append_dev(div0, t4);
    			append_dev(div0, button0);
    			append_dev(div3, t6);
    			append_dev(div3, div1);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				if (each_blocks[i]) {
    					each_blocks[i].m(div1, null);
    				}
    			}

    			append_dev(div3, t7);
    			append_dev(div3, div2);
    			append_dev(div2, button1);
    			append_dev(button1, t8);
    			append_dev(div2, t9);
    			append_dev(div2, button2);
    			append_dev(button2, t10);
    			append_dev(div2, t11);
    			append_dev(div2, button3);
    			append_dev(button3, t12);
    			insert_dev(target, t13, anchor);
    			insert_dev(target, footer, anchor);
    			append_dev(footer, p);
    			append_dev(p, t14);
    			append_dev(p, a0);
    			append_dev(p, t16);
    			append_dev(p, img);
    			append_dev(p, t17);
    			append_dev(p, a1);

    			if (!mounted) {
    				dispose = [
    					listen_dev(input, "input", /*input_input_handler*/ ctx[6]),
    					listen_dev(button0, "click", /*addTask*/ ctx[3], false, false, false, false),
    					listen_dev(button1, "click", /*click_handler_4*/ ctx[11], false, false, false, false),
    					listen_dev(button2, "click", /*click_handler_5*/ ctx[12], false, false, false, false),
    					listen_dev(button3, "click", /*click_handler_6*/ ctx[13], false, false, false, false)
    				];

    				mounted = true;
    			}
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*task*/ 2 && input.value !== /*task*/ ctx[1]) {
    				set_input_value(input, /*task*/ ctx[1]);
    			}

    			if (dirty & /*removeTask, todos, markComplete, filter*/ 53) {
    				each_value = /*todos*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(div1, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}

    			if (dirty & /*filter*/ 4 && button1_class_value !== (button1_class_value = "" + (null_to_empty(/*filter*/ ctx[2] == 'all' ? 'active' : '') + " svelte-gyjtjx"))) {
    				attr_dev(button1, "class", button1_class_value);
    			}

    			if (dirty & /*filter*/ 4 && button2_class_value !== (button2_class_value = "" + (null_to_empty(/*filter*/ ctx[2] == 'completed' ? 'active' : '') + " svelte-gyjtjx"))) {
    				attr_dev(button2, "class", button2_class_value);
    			}

    			if (dirty & /*filter*/ 4 && button3_class_value !== (button3_class_value = "" + (null_to_empty(/*filter*/ ctx[2] == 'incomplete' ? 'active' : '') + " svelte-gyjtjx"))) {
    				attr_dev(button3, "class", button3_class_value);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(header);
    			if (detaching) detach_dev(t3);
    			if (detaching) detach_dev(div4);
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(t13);
    			if (detaching) detach_dev(footer);
    			mounted = false;
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots('App', slots, []);
    	let todos = [];
    	let task = "";
    	let filter = 'all';

    	function addTask() {
    		$$invalidate(0, todos = [{ task, status: "pending" }, ...todos]);
    		$$invalidate(1, task = "");
    	}

    	function markComplete(i) {
    		$$invalidate(0, todos[i].status = "completed", todos);
    		$$invalidate(0, todos = [...todos]);
    	}

    	function removeTask(i) {
    		todos.splice(i, 1);
    		$$invalidate(0, todos = [...todos]);
    	}

    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== '$$' && key !== 'slot') console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	function input_input_handler() {
    		task = this.value;
    		$$invalidate(1, task);
    	}

    	const click_handler = i => {
    		markComplete(i);
    	};

    	const click_handler_1 = i => {
    		removeTask(i);
    	};

    	const click_handler_2 = i => {
    		removeTask(i);
    	};

    	const click_handler_3 = i => {
    		markComplete(i);
    	};

    	const click_handler_4 = () => {
    		$$invalidate(2, filter = 'all');
    	};

    	const click_handler_5 = () => {
    		$$invalidate(2, filter = 'completed');
    	};

    	const click_handler_6 = () => {
    		$$invalidate(2, filter = 'incomplete');
    	};

    	$$self.$capture_state = () => ({
    		todos,
    		task,
    		filter,
    		addTask,
    		markComplete,
    		removeTask
    	});

    	$$self.$inject_state = $$props => {
    		if ('todos' in $$props) $$invalidate(0, todos = $$props.todos);
    		if ('task' in $$props) $$invalidate(1, task = $$props.task);
    		if ('filter' in $$props) $$invalidate(2, filter = $$props.filter);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [
    		todos,
    		task,
    		filter,
    		addTask,
    		markComplete,
    		removeTask,
    		input_input_handler,
    		click_handler,
    		click_handler_1,
    		click_handler_2,
    		click_handler_3,
    		click_handler_4,
    		click_handler_5,
    		click_handler_6
    	];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

})();
//# sourceMappingURL=bundle.js.map
