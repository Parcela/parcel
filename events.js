/* globals document:true */

"use strict";

/**
 * Extends the Event-instance by adding the object `listener` to it.
 * The returned object should be merged into any Class-instance or object you want to
 * extend with the listener-methods, so the appropriate methods can be invoked on the instance.
 *
 * Should be called using  the provided `extend`-method like this:
 * @example
 *     var coreEventListener = require('core-event-listener');<br>
 *     coreEventListener.extend(ITSA.event);
 *
 * @module parcel
 * @submodule parcel-event-listener
 * @class Parcel.Listener
 * @since 0.0.1
 *
 * <i>Copyright (c) 2014 Parcela - https://github.com/Parcela</i>
 * New BSD License - https://github.com/ItsAsbreuk/itsa-library/blob/master/LICENSE
 *
*/

// Include Function.mergePrototypes:
require('core-lang-ext');

var NAME = '[parcel-events]: ',
    EventEmitter = require('event/event-emitter.js'),
    DOCUMENT = document,

createListener = {
    mergeInto: function (ParcelClass, instanceEvent) {
        /**
         * Holds all event-listener methods.
         * The returned object should be merged into any Class-instance or object you want to
         * extend with the listener-methods, so the appropriate methods can be invoked on the instance.
         *
         * See [Event.listener](Event.listener.html) for all properties that can be merged.
         *
         * @example
         *     var blueObject = {};
         *     blueObject.merge(Event.Listener);
         *     blueObject.after('*:save', function(e) {
         *         ...
         *     });
         *
         * @example
         *     Members.mergePrototypes(Event.Listener);
         *     var myMembers = new Members();
         *     myMembers.after('PersonalProfile:save', function(e) {
         *         ...
         *     });
         *
         * @for Parcel
         * @property EventListener
         * @type Object
         * @since 0.0.1
         */

        /**
         * This object should be merged into any Class-instance or object that you want to provide
         * event-listener methods. This way, the appropriate methods can be invoked on the instance.
         * instead of using the static Event-methods.
         *
         * It is highly recommendable to merge on the prototype instead of the instance. See the docs.
         *
         * @class Parcel.EventListener
         *
        */

        // if Event doesn't have its Emitter plugin, then we will plug it in now:
        instanceEvent.Emitter || (EventEmitter.mergeInto(instanceEvent));

        instanceEvent._getCurrentTarget = function(subscriber) {
            var ispNode = (typeof ((subscriber.o.parcel && subscriber.o.parcel.view) || subscriber.o.view) === 'function');
            ispNode && (subscriber.parcel=true);
            // in case of pNode, subscriber.o._pNode might not exist yet --> so we can't return anything at this stage
            // it will be set the first time the even gets called inside _invokeSubs
            return ispNode ? undefined : DOCUMENT;
        };

        /**
         * Given a domnode and a parcel, this method returns an object from the parcel
         * with information about which vNode corresponds with the domnode and the parcelTree towards
         * this vNode.
         *
         * @method _getPVnode
         * @param parcel {parcel} Parcelinstance to search through
         * @param domnode {DOMnode} DOMnode to search for
         * @private
         * @return {Object|undefined} undefined when `domnode` is not within the parcel, the object has 2 properties:
         * <ul>
         *     <li>vNode: vNode that corresponds with domnode</li>
         *     <li>parcelTree: array with Parcels downto the parcel that holds vNode. Top down: the first item
         *         is the parcel that was passed through as first argument</li>
         * </ul>
         * @since 0.0.1
         */
        instanceEvent._getPVnode = function(parcel, domnode) {
            var pNode = parcel._pNode,
                parcelTree = [pNode],
                vNode, returnObject,
                getChildPVnode = function(children) {
                    var found;
                    children.some(
                        function(child) {
                            var vChildren,
                                ispNode;
                            // only pNodes and vNodes can have a DOMnode bounded
                            if (typeof child === 'object') {
                                ispNode = (typeof ((child.parcel && child.parcel.view) || child.view) === 'function');
                                if (child.node===domnode) {
                                    // the vNode's node matches the searched domnode
                                    found = child;
                                }
                                else {
                                    // inspect its children
                                    vChildren = child.children;
                                    Array.isArray(vChildren) || (vChildren=[vChildren]);
                                    ispNode && parcelTree.push(child.parcel);
                                    found = getChildPVnode(vChildren);
                                    found || (ispNode && parcelTree.splice(parcelTree.length-1, 1));
                                }
                                return found;
                            }
                        }
                    );
                    return found;
                };

            if (pNode && pNode.children) {
                vNode = getChildPVnode(pNode.children);
                returnObject = vNode ? {vNode: vNode, parcelTree: parcelTree} : undefined;
            }
            return returnObject;
        };

        // now redefine Event._invokeSubs --> it needs to work a bit differently when using Parcels combined with
        // DOM-events because we have the dom-bubble chain
        /**
         * Does the actual invocation of a subscriber. Overrides _invokesSubs from `event-base`.
         *
         * @method _invokeSubs
         * @param e {Object} event-object
         * @param subscribers {Array} contains subscribers (objects) with these members:
         * <ul>
         *     <li>subscriber.o {Object} context of the callback</li>
         *     <li>subscriber.cb {Function} callback to be invoked</li>
         *     <li>subscriber.f {Function} filter to be applied</li>
         *     <li>subscriber.t {DOM-node|pNode|vNode} target for the specific selector, which will be set as e.target
         *         only when event-dom is active and there are filter-selectors</li>
         *     <li>subscriber.n {DOM-node|pNode} highest dom-node that acts as the container for delegation.
         *         only when core-event-dom is active and there are filter-selectors</li>
         * </ul>
         * @param [before] {Boolean} whether it concerns before subscribers
         * @param [sort] {Function} a sort function to controll the order of execution.
         *             Only applyable when working with DOM-events (bubble-order), provided by `core-event-dom`
         * @private
         * @since 0.0.1
         */
        //
        // CAUTIOUS: When making changes here, you should look whether these changes also effect `_invokeSubs()`
        // inside `event-base`
        //
        instanceEvent._invokeSubs = function (e, subscribers, before, sort) {
            var instance = this,
                subs, propagationStopped, targetnode, pvnode;

            // if `sort` exists, we create a new sub-array with the items that passed the filter
            // this subarray gets sorted. We ALWAYS need to do this on every event: the dom could have changed
            if (sort) {
                subs = subscribers.filter(
                           function(subscriber) {
                               return subscriber.f ? subscriber.f.call(subscriber.o, e) : (subscriber.parcel && !!instance._getPVnode(subscriber.o, e.target));
                           }
                       );

                // at this point, we need to find out what are the current node-refs. whenever there is
                // a filter that starts with `#` --> in those cases we have a bubble-chain, because the selector isn't
                // set up with `document` at its root.
                // we couldn't do this at time of subscribtion, for the nodes might not be there at that time.
                // however, we only need to do this once: we store the value if we find them
                // no problem when the nodes leave the dom later: the previous filter wouldn't pass
                subs.each(function(subscriber) {
                    // the node-ref is specified with `subscriber.n`
                    if (!subscriber.n) {
                        if (subscriber.nId) {
                            subscriber.n = DOCUMENT.getElementById(subscriber.nId);
                            // careful: if the subscriber is a parcel, then we want the vNode instead of the domnode
                            subscriber.parcel && (pvnode=instance._getPVnode(subscriber.o, subscriber.n)) && (subscriber.n=pvnode.vNode);
                        }
                        else if (subscriber.parcel) {
                            subscriber.n = subscriber.o._pNode;
                        }
                    }
                });

                // now we sort, based upon the sortFn
                subs.sort(sort);
            }
            else {
                subs = subscribers;
            }

            // if `subs` was processed by the sort function, it also has only subscribers that passed their filter
            // if not, the `subs` equals `subscribers` and we still need to check their filter before invoke them
            subs.some(function(subscriber) {
                // inside the aftersubscribers, we may need exit right away.
                // this would be the case whenever stopPropagation or stopImmediatePropagation was called
                if (sort) {
                    // in case the subscribernode equals the node on which stopImmediatePropagation was called: return true
                    targetnode = (subscriber.t || subscriber.n);

                    if (e.status.immediatePropagationStopped===targetnode) {
                        return true;
                    }
                    // in case the subscribernode does not fall within or equals the node on which stopPropagation was called: return true
                    propagationStopped = e.status.propagationStopped;
                    if (propagationStopped && (propagationStopped!==targetnode) && !instance._nodeContains(propagationStopped, targetnode)) {
                        return true;
                    }
                }

                // check: if `sort` exists, then the filter is already supplied, but we need to set e.currentTarget for every bubble-level
                // is `sort` does not exists, then the filter is not yet supplied and we need to it here
                if (sort ? (e.currentTarget=targetnode) : (!subscriber.f || subscriber.f.call(subscriber.o, e))) {
                    // now we might need to set e.target to the right node:
                    // the filterfunction might have found the true domnode that should act as e.target
                    // and set it at subscriber.t
                    // also, we need to backup the original e.target: this one should be reset when
                    // we encounter a subscriber with its own filterfunction instead of selector
                    if (subscriber.t) {
                        e._originalTarget || (e._originalTarget=e.target);
                        e.target = subscriber.t;
                    }
                    else {
                        e._originalTarget && (e.target=e._originalTarget);
                    }
                }

                // finally: invoke subscriber
                subscriber.cb.call(subscriber.o, e);

                if (e.status.unSilencable && e.silent) {
                    console.warn(NAME, ' event '+e.emitter+':'+e.type+' cannot made silent: this customEvent is defined as unSilencable');
                    e.silent = false;
                }

                return e.silent ||
                      (before && (
                              e.status.halted || (
                                  sort && (
                                      ((propagationStopped=e.status.propagationStopped) && (propagationStopped!==targetnode)) || e.status.immediatePropagationStopped
                                  )
                              )
                          )
                      );
            });
        };
        /**
         * Creates a filterfunction out of a css-selector. To be used for catching any dom-element
         * that happens on domnodes within the parcel-instance. Makes e.target to reurn the vNode.
         * also adds e.parcelTree which is the tree of all Parcel-instances between the Parcel that
         * got the subscriber and the vNode that where there was a match with the selector.
         *
         * On "non-outside" events, subscriber.t is set to the node that first matches the selector
         * so it can be used to set as e.target in the final subscriber
         *
         * @method _parcelSelToDom
         * @param subscriber {Object} Subscriber-object
         * @param selector {String} css-selector
         * @param [outsideEvent] {Boolean} whetrer it is an outside-event (like `clickoutside`)
         * @private
         * @since 0.0.1
         */
        instanceEvent._parcelSelToVDom = function(subscriber, selector, outsideEvent) {
            // CAUTIOUS: parcelinstance._pNode is undefined when the subscriber is set up within `init`
            // therefore, we need to take its reference inside the filterfunction
            // this stage is runned during subscription
            var instance = this;
            return function(e) {
                // this stage is runned when the event happens
                var node = e.target,
                    parcelinstance = subscriber.o,
                    pNode_node = parcelinstance._pNode && parcelinstance._pNode.node,
                    match = false,
                    vnodeInfo;
                // e.target is the most deeply node in the dom-tree that caught the event
                // our listener uses `selector` which might be a node higher up the tree.
                // we will reset e.target to this node (if there is a match)
                // note that e.currentTarget will always be `document` --> we're not interested in that
                // also, we don't check for `node`, but for node.matchesSelector: the highest level `document`
                // is not null, yet it doesn;t have .matchesSelector so it would fail
                if (selector && (vnodeInfo=instance._getPVnode(parcelinstance, node))) {
                    while (!match) {
                        match = node.matchesSelector(selector);
                        // reset e.target to the target that matches the selector
                        if (match) {
                            if (!outsideEvent) {
                                e.target===node || (vnodeInfo=instance._getPVnode(parcelinstance, node));
                                subscriber.t = vnodeInfo.vNode;
                                e.parcelTree = vnodeInfo.parcelTree;
                            }
                        }
                        else {
                            node = node.parentNode;
                        }
                    }
                }
                else {
                    // only accept exact match at containernode
                    match = (node===pNode_node);
                    match || (subscriber.t=pNode_node);
                }
                return !outsideEvent ? match : !match;
            };
        };

        /**
         * Creates a filterfunction out of a css-selector.
         * On "non-outside" events, subscriber.t is set to the node that first matches the selector
         * so it can be used to set as e.target in the final subscriber
         *
         * @method _selToFunc
         * @param subscriber {Object} Subscriber-object
         * @param selector {String} css-selector
         * @param [outsideEvent] {Boolean} whetrer it is an outside-event (like `clickoutside`)
         * @private
         * @since 0.0.1
         */
        instanceEvent._selToFunc = function(subscriber, selector, outsideEvent) {
            // return `_domSelToFunc` by default
            // Parcel.Event uses a different selectormethod.
            var context = subscriber.o,
                isParcel = context && (typeof context.view==='function') && (typeof context.stamp==='function');
            return isParcel ? this._parcelSelToVDom(subscriber, selector, outsideEvent) : this._domSelToFunc(subscriber, selector, outsideEvent);
        };

/*  NOT GOING to use this. It would have been a quicker way, but we need vDOM-information
        instanceEvent._parcelSelToDom = function(subscriber, selector, outsideEvent) {
            // CAUTIOUS: parcelinstance._pNode is undefined when the subscriber is set up within `init`
            // therefore, we need to take its reference inside the filterfunction
            return function(e) {
                var node = e.target,
                    parcelinstance = subscriber.o,
                    pNode_node = parcelinstance._pNode && parcelinstance._pNode.node,
                    match = false;
                // e.target is the most deeply node in the dom-tree that caught the event
                // our listener uses `selector` which might be a node higher up the tree.
                // we will reset e.target to this node (if there is a match)
                // note that e.currentTarget will always be `document` --> we're not interested in that
                // also, we don't check for `node`, but for node.matchesSelector: the highest level `document`
                // is not null, yet it doesn;t have .matchesSelector so it would fail
                if (selector && pNode_node.contains(node)) {
                    while (!match && (pNode_node!==node)) {
                        match = node.matchesSelector(selector);
                        // reset e.target to the target that matches the selector
                        if (match) {
                            !outsideEvent || (subscriber.t=node);
                        }
                        else {
                            node = node.parentNode;
                        }
                    }
                }
                else {
                    // only accept exact match at containernode
                    match = (node===pNode_node);
                    match || (subscriber.t=pNode_node);
                }
                return !outsideEvent ? match : !match;
            };
        };
*/

            instanceEvent._vNodeContains = function(vNodeA, vNodeB) {
                var findPVnode = function(vNode) {
                    var found = false;
                    vNode.children.some(
                        function(child) {
                            found = (child===vNodeB) || (child.children && findPVnode(child));
                            return found;
                        }
                    );
                    return !!found;
                };
                return vNodeA.children ? findPVnode(vNodeA) : false;
            };

            /**
             * Sort nodes conform the dom-tree by looking at their position inside the tree.
             * overrules '_sortSubsDOM' from
             *
             * @method _sortSubsDOM
             * @param customEvent {String}
             * @private
             * @return {Function} sortable function
             * @since 0.0.1
             */
            instanceEvent._sortSubsDOM = function(subscriberOne, subscriberTwo) {
                return this._nodeContains(subscriberOne.t || subscriberOne.n, subscriberTwo.t || subscriberTwo.n) ? 1 : -1;
            };

            instanceEvent._nodeContains = function(nodeA, nodeB) {
                var aIsDomNode = nodeA.clientHeight,
                    bIsDomNode = nodeB.clientHeight,
                    a, b;
                if (!aIsDomNode && !bIsDomNode) {
                    return this._vNodeContains(nodeA, nodeB);
                }
                else {
                    a = aIsDomNode ? nodeA : nodeA.node;
                    b = bIsDomNode ? nodeB : nodeB.node;
                    return a.contains(b);
                }
            };

        ParcelClass.mergePrototypes({

            /**
             * Defines an emitterName into the instance.
             * This will add a protected property `_emitterName` to the instance. If you need an emitterName on
             * the Class, you should use the Event.Emitter helper: `ClassName.mergePrototypes(Event.Emitter(emitterName));`
             *
             * @static
             * @method defineEmitter
             * @param emitterName {String} identifier that will be added when events are sent (`emitterName:eventName`)
             * @since 0.0.1
            */
            defineEmitter: function(emitterName) {
                 // force assign: there might be an emittername on the Class
                this.merge(instanceEvent.Emitter(emitterName), true);
            },

            /**
             * Subscribes to a customEvent on behalf of the object who calls this method.
             * The callback will be executed `after` the defaultFn.
             *
             * @method after
             * @param customEvent {String|Array} the custom-event (or Array of events) to subscribe to. CustomEvents should
             *        have the syntax: `emitterName:eventName`. Wildcard `*` may be used for both `emitterName` as well as `eventName`.
             *        If `emitterName` is not defined, `UI` is assumed.
             * @param callback {Function} subscriber:will be invoked when the event occurs. An `eventobject` will be passed
             *        as its only argument.
             * @param [filter] {String|Function} to filter the event.
             *        Use a String if you want to filter DOM-events by a `selector`
             *        Use a function if you want to filter by any other means. If the function returns a trully value, the
             *        subscriber gets invoked. The function gets the `eventobject` as its only argument and the context is
             *        the subscriber.
             * @param [prepend=false] {Boolean} whether the subscriber should be the first in the list of after-subscribers.
             * @return {Object} handler with a `detach()`-method which can be used to detach the subscriber
             * @since 0.0.1
            */
            after: function (customEvent, callback, filter, prepend) {
                return instanceEvent.after(customEvent, callback, this, filter, prepend);
            },

            /**
             * Subscribes to a customEvent on behalf of the object who calls this method.
             * The callback will be executed `before` the defaultFn.
             *
             * @method before
             * @param customEvent {String|Array} the custom-event (or Array of events) to subscribe to. CustomEvents should
             *        have the syntax: `emitterName:eventName`. Wildcard `*` may be used for both `emitterName` as well as `eventName`.
             *        If `emitterName` is not defined, `UI` is assumed.
             * @param callback {Function} subscriber:will be invoked when the event occurs. An `eventobject` will be passed
             *        as its only argument.
             * @param [filter] {String|Function} to filter the event.
             *        Use a String if you want to filter DOM-events by a `selector`
             *        Use a function if you want to filter by any other means. If the function returns a trully value, the
             *        subscriber gets invoked. The function gets the `eventobject` as its only argument and the context is
             *        the subscriber.
             * @param [prepend=false] {Boolean} whether the subscriber should be the first in the list of before-subscribers.
             * @return {Object} handler with a `detach()`-method which can be used to detach the subscriber
             * @since 0.0.1
            */
            before: function (customEvent, callback, filter, prepend) {
                return instanceEvent.before(customEvent, callback, this, filter, prepend);
            },

            /**
             * Detaches (unsubscribes) the listener from the specified customEvent,
             * on behalf of the object who calls this method.
             *
             * @method detach
             * @param customEvent {String} conform the syntax: `emitterName:eventName`, wildcard `*` may be used for both
             *        `emitterName` as well as only `eventName`, in which case 'UI' will become the emitterName.
             * @since 0.0.1
            */
            detach: function(customEvent) {
                instanceEvent.detach(this, customEvent);
            },

            /**
             * Detaches (unsubscribes) the listener from all customevents,
             * on behalf of the object who calls this method.
             *
             * @method detachAll
             * @since 0.0.1
            */
            detachAll: function() {
                instanceEvent.detachAll(this);
            },

            /**
             * Alias for `after`.
             *
             * Subscribes to a customEvent on behalf of the object who calls this method.
             * The callback will be executed `after` the defaultFn.
             *
             * @method on
             * @param customEvent {String|Array} the custom-event (or Array of events) to subscribe to. CustomEvents should
             *        have the syntax: `emitterName:eventName`. Wildcard `*` may be used for both `emitterName` as well as `eventName`.
             *        If `emitterName` is not defined, `UI` is assumed.
             * @param callback {Function} subscriber:will be invoked when the event occurs. An `eventobject` will be passed
             *        as its only argument.
             * @param [filter] {String|Function} to filter the event.
             *        Use a String if you want to filter DOM-events by a `selector`
             *        Use a function if you want to filter by any other means. If the function returns a trully value, the
             *        subscriber gets invoked. The function gets the `eventobject` as its only argument and the context is
             *        the subscriber.
             * @param [prepend=false] {Boolean} whether the subscriber should be the first in the list of after-subscribers.
             * @return {Object} handler with a `detach()`-method which can be used to detach the subscriber
             * @since 0.0.1
            */
            on: function (/* customEvent, callback, filter, prepend */) {
                return this.after.apply(this, arguments);
            },

            /**
             * Alias for `onceAfter`.
             *
             * Subscribes to a customEvent on behalf of the object who calls this method.
             * The callback will be executed `after` the defaultFn.
             * The subscriber will be automaticly removed once the callback executed the first time.
             * No need to `detach()` (unless you want to undescribe before the first event)
             *
             * @method onceAfter
             * @param customEvent {String|Array} the custom-event (or Array of events) to subscribe to. CustomEvents should
             *        have the syntax: `emitterName:eventName`. Wildcard `*` may be used for both `emitterName` as well as `eventName`.
             *        If `emitterName` is not defined, `UI` is assumed.
             * @param callback {Function} subscriber:will be invoked when the event occurs. An `eventobject` will be passed
             *        as its only argument.
             * @param [filter] {String|Function} to filter the event.
             *        Use a String if you want to filter DOM-events by a `selector`
             *        Use a function if you want to filter by any other means. If the function returns a trully value, the
             *        subscriber gets invoked. The function gets the `eventobject` as its only argument and the context is
             *        the subscriber.
             * @param [prepend=false] {Boolean} whether the subscriber should be the first in the list of after-subscribers.
             * @return {Object} handler with a `detach()`-method which can be used to detach the subscriber
             * @since 0.0.1
            */
            once: function (/* customEvent, callback, filter, prepend */) {
                return this.onceAfter.apply(this, arguments);
            },

            /**
             * Subscribes to a customEvent on behalf of the object who calls this method.
             * The callback will be executed `after` the defaultFn.
             * The subscriber will be automaticly removed once the callback executed the first time.
             * No need to `detach()` (unless you want to undescribe before the first event)
             *
             * @method onceAfter
             * @param customEvent {String|Array} the custom-event (or Array of events) to subscribe to. CustomEvents should
             *        have the syntax: `emitterName:eventName`. Wildcard `*` may be used for both `emitterName` as well as `eventName`.
             *        If `emitterName` is not defined, `UI` is assumed.
             * @param callback {Function} subscriber:will be invoked when the event occurs. An `eventobject` will be passed
             *        as its only argument.
             * @param [filter] {String|Function} to filter the event.
             *        Use a String if you want to filter DOM-events by a `selector`
             *        Use a function if you want to filter by any other means. If the function returns a trully value, the
             *        subscriber gets invoked. The function gets the `eventobject` as its only argument and the context is
             *        the subscriber.
             * @param [prepend=false] {Boolean} whether the subscriber should be the first in the list of after-subscribers.
             * @return {Object} handler with a `detach()`-method which can be used to detach the subscriber
             * @since 0.0.1
            */
            onceAfter: function (customEvent, callback, filter, prepend) {
                return instanceEvent.onceAfter(customEvent, callback, this, filter, prepend);
            },

            /**
             * Subscribes to a customEvent on behalf of the object who calls this method.
             * The callback will be executed `before` the defaultFn.
             * The subscriber will be automaticly removed once the callback executed the first time.
             * No need to `detach()` (unless you want to undescribe before the first event)
             *
             * @method onceBefore
             * @param customEvent {String|Array} the custom-event (or Array of events) to subscribe to. CustomEvents should
             *        have the syntax: `emitterName:eventName`. Wildcard `*` may be used for both `emitterName` as well as `eventName`.
             *        If `emitterName` is not defined, `UI` is assumed.
             * @param callback {Function} subscriber:will be invoked when the event occurs. An `eventobject` will be passed
             *        as its only argument.
             * @param [filter] {String|Function} to filter the event.
             *        Use a String if you want to filter DOM-events by a `selector`
             *        Use a function if you want to filter by any other means. If the function returns a trully value, the
             *        subscriber gets invoked. The function gets the `eventobject` as its only argument and the context is
             *        the subscriber.
             * @param [prepend=false] {Boolean} whether the subscriber should be the first in the list of before-subscribers.
             * @return {Object} handler with a `detach()`-method which can be used to detach the subscriber
             * @since 0.0.1
            */
            onceBefore: function (customEvent, callback, filter, prepend) {
                return instanceEvent.onceBefore(customEvent, callback, this, filter, prepend);
            }
        });
    }
};

module.exports = createListener;