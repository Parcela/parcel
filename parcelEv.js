"use strict";

require('lang-ext');
var Parcel = require('./parcel.js');


var ParcelEv = Parcel.subClass({
	preView: function () {
		var evts = this.EVENTS || {},
			self = this;

		evts.each(function (evs, type) {
			if (!evs._cb) {
				evs._cb = self._eventListener.bind(self);
				self._pNode.node.addEventListener(type, evs._cb);
			}
		});
		ParcelEv.$super.preView.apply(self, arguments);
	},
	_eventListener: function (ev) {
		var evts = this.EVENTS[ev.type] || {},
			self = this;
		evts.each(function (listener, sel) {
			if (ev.target.matches(sel)) {
				(typeof listener === 'function'?listener:self[listener]).call(self, ev);
			}
		});
	},
	postView: function () {
		var evts = this.EVENTS || {},
			self = this;
		evts.each(function (ev, type) {
			self._pNode.node.removeEventListener(type, ev._cb);
			ev._cb = null;
		});
		ParcelEv.$super.postView.apply(this, arguments);
	}
});

module.exports = ParcelEv;
