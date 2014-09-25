/*global describe, it */
"use strict";
var expect = require('chai').expect;

require('lang-ext');
var simulateClick = require('simulateClick');

(function (window) {
	var vDOM = require('virtual-dom')(window),
		v = vDOM.vNode,
		ParcelEv = require("../parcelEv.js");

	
	describe('simple click', function () {
		it('with a single element', function () {
			var p,
				beenThere = false,
				P = ParcelEv.subClass({
				view: function () {
					return v('button#id','hello');
				},
				EVENTS: {
					click: {
						button: function (ev) {
							expect(this).eql(p);
							beenThere = true;
						}
					}
				}
			});
			
			p = vDOM.rootApp(P);
			simulateClick(window.document.getElementById('id'));
			expect(beenThere).to.be.true;
			vDOM.rootApp(ParcelEv);
			expect(p.EVENTS.click._cb).to.be.null;
			
		});
		it('with a nested elements', function () {
			var p,
				a = '',
				P = ParcelEv.subClass({
				view: function () {
					return v('div#id',[
						v('button#id0','hello'),
						v('button#id1','hello')
					]);
				},
				EVENTS: {
					click: {
						div: function (ev) {
							//should never bubble into this one
							expect(this).eql(p);
							a += ev.target.id;
						},
						button: function (ev) {
							expect(this).eql(p);
							a += ev.target.id;
						}
					}
				}
			});
			
			p = vDOM.rootApp(P);
			simulateClick(window.document.getElementById('id0'));
			expect(a).eql('id0');
			vDOM.rootApp(ParcelEv);
			
		});
	});

})(global.window || require('fake-dom'));

