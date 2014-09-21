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
require('lang-ext');
var NAME = '[parcel-events]: ',
    PARCELA_EMITTER = 'ParcelaEvent',
    REGEXP_NODE_ID = /^#\S+$/,
    REGEXP_EXTRACT_NODE_ID = /#(\S+)/,
    REGEXP_UI_OUTSIDE = /^.+outside$/;

module.exports = function (window) {

    require('event/event-emitter.js');

    var Event = require('event-dom')(window),
		Parcel = require('./parcel.js'),
        DOCUMENT = window.document,
        _parcelSelToFunc;

    /*
     * Creates a filterfunction out of a css-selector. To be used for catching any dom-element, without restrictions
     * of any context (like Parcels can --> Parcel.Event uses _parcelSelToDom instead)
     * On "non-outside" events, subscriber.t is set to the node that first matches the selector
     * so it can be used to set as e.target in the final subscriber
     *
     * @param customEvent {String} the customEvent that is transported to the eventsystem
     * @param subscriber {Object} subscriber
     * @param subscriber.o {Object} context
     * @param subscriber.cb {Function} callbackFn
     * @param subscriber.f {Function|String} filter
     * @param subscriber.n {dom-node} becomes e.currentTarget
     * @param subscriber.t {dom-node} becomes e.target
     * @private
     * @since 0.0.1
     */
    _parcelSelToFunc = function(customEvent, subscriber) {
        // this stage is runned during subscription
        var selector = subscriber.f,
            parcelinstance = subscriber.o,
            nodeid, byExactId, outsideEvent;

        if ((typeof parcelinstance.stamp!=='function') || (typeof parcelinstance.view!=='function')) {
            // no parceltinstance: exit
            return;
        }
        console.log(NAME, '_parcelSelToFunc type of selector = '+typeof selector);

        // in case of no selector: we still need to process: parcelinstance._pNode becomes the currentTarget
        // to match against. Thus only leave when selector is a function
        if (typeof selector === 'function') {
            subscriber.n || (subscriber.n=DOCUMENT);
            return;
        }

        outsideEvent = REGEXP_UI_OUTSIDE.test(customEvent);

        if (selector) {
            nodeid = selector.match(REGEXP_EXTRACT_NODE_ID);
            nodeid && (subscriber.nId=nodeid[1]);
            byExactId = REGEXP_NODE_ID.test(selector);

            subscriber.f = function(e) {
                // this stage is runned when the event happens
                console.log(NAME, '_parcelSelToFunc inside filter');
                var node = e.target,
                    pNode_node = parcelinstance._pNode && parcelinstance._pNode.node,
                    match = false,
                    pvNodeInfo;

                // do need to set subscriber.n, otherwise filtering goes wrong
                nodeid || (subscriber.n=pNode_node);

                // e.target is the most deeply node in the dom-tree that caught the event
                // our listener uses `selector` which might be a node higher up the tree.
                // we will reset e.target to this node (if there is a match)
                // note that e.currentTarget will always be `document` --> we're not interested in that
                // also, we don't check for `node`, but for node.matchesSelector: the highest level `document`
                // is not null, yet it doesn;t have .matchesSelector so it would fail
                while (pNode_node.contains(node) && !match) {
                    console.log(NAME, '_parcelSelToFunc inside filter check match');
                    if (byExactId) {
                        match = (node.id===selector.substr(1)) && pNode_node.contains(node);
                    }
                    else {
                        match = node.matchesSelector(selector);
                    }
                    // if there is a match, then set
                    // e.target to the target that matches the selector
                    if (match && !outsideEvent) {
                        subscriber.t = node;
                    }
                    node = node.parentNode;
                }
                console.log(NAME, '_parcelSelToFunc filter returns '+(!outsideEvent ? match : !match));
                return !outsideEvent ? match : !match;
            };
        }
        else {
            subscriber.f = function(e) {
                // this stage is runned when the event happens
                console.log(NAME, '_parcelSelToFunc inside filter');
                var node = e.target,
                    pNode_node = parcelinstance._pNode && parcelinstance._pNode.node,
                    match = pNode_node.contains(node);

                subscriber.n = pNode_node;
                if (match && !outsideEvent) {
                    subscriber.t = pNode_node;
                }
                return !outsideEvent ? match : !match;
            };
        }
        return true;
    };

    // whenever a subscriber gets defined with a css-selector instead of a filterfunction,
    // the event: 'ParcelaEvent:selectorsubs' get emitted. We need to catch this event and transform its
    // selector into a filter-function:
    Event._sellist.unshift(_parcelSelToFunc);

    var ParcelEv =  Parcel.subClass({

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
			this.merge(Event.Emitter(emitterName), true);
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
			return Event.after(customEvent, callback, this, filter, prepend);
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
			return Event.before(customEvent, callback, this, filter, prepend);
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
			Event.detach(this, customEvent);
		},

		/**
		 * Detaches (unsubscribes) the listener from all customevents,
		 * on behalf of the object who calls this method.
		 *
		 * @method detachAll
		 * @since 0.0.1
		*/
		detachAll: function() {
			Event.detachAll(this);
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
			return Event.onceAfter(customEvent, callback, this, filter, prepend);
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
			return Event.onceBefore(customEvent, callback, this, filter, prepend);
		},
		/**
		Override Parcel's own `destroy` method to ensure destroying all the attached methods.

		@method destroy
		*/
		destroy: function () {
			ParcelEv.$super.destroy.call(this);
			this.detachAll();
		}
	});
	return ParcelEv;

};