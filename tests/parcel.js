/*global describe, it */
"use strict";
var expect = require('chai').expect,
	should = require('chai').should();
require('lang-ext');
(function (window) {
	var v = require('virtual-dom')(window),
		Parcel = require("../parcel");

	var P1 = Parcel.subClass({
		init: function (config) {
			this.counter = config.start || 0;
		},
		view: function () {
			return v.vNode('div.parcel',[
				v.vNode('p',this.counter),
				v.vNode('br')
			]);
		}

	});

	describe('Parcel', function () {
		describe('instance of', function () {
			var p = new Parcel();
			it('Parcel', function () {
				p.should.be.an.instanceof(Parcel);
				p.should.not.be.an.instanceof(P1);
			});
			var p1 = new P1();
			it('P1', function () {
				p1.should.be.an.instanceof(Parcel);
				p1.should.be.an.instanceof(P1);
			});
		});
		describe('init', function () {
			describe('no initial config', function () {
				var p = new P1();
				it('should have initialized counter', function () {
					(p.counter).should.be.equal(0);
				});
			});
			describe('no initial config', function () {
				var p = new P1({start:1});
				it('should have initialized counter', function () {
					(p.counter).should.be.equal(1);
				});
			});
		});
		describe('On initialization', function () {
			it('config should always be an object', function (done) {
				var P = Parcel.subClass({
					init: function (config) {
						expect(config).to.be.an('object');
						done();
					}
				});
				var p = new P();

			});
			it('config should take defaults', function (done) {
				var P = Parcel.subClass({
					defaultConfig: {
						a:1,
						b:2
					},
					init: function (config) {
						expect(config).to.be.an('object');
						expect(this.a).eql(1);
						expect(this.b).eql(2);
						expect(config.a).eql(1);
						expect(config.b).eql(2);
						done();
					}
				});
				var p = new P();

			});
			it('config should take config or defaults', function (done) {
				var P = Parcel.subClass({
					defaultConfig: {
						a:1,
						b:2
					},
					init: function (config) {
						expect(config).to.be.an('object');
						expect(this.a).eql(9);
						expect(this.b).eql(2);
						expect(config.a).eql(9);
						expect(config.b).eql(2);
						done();
					}
				});
				var p = new P({a:9});

			});
			it('config should take defaults and extras', function (done) {
				var P = Parcel.subClass({
					defaultConfig: {
						a:1,
						b:2
					},
					init: function (config, extra) {
						expect(config).to.be.an('object');
						expect(this.a).eql(1);
						expect(this.b).eql(2);
						expect(this.c).eql(3);
						expect(config.a).eql(1);
						expect(config.b).eql(2);
						expect(config.c).eql(3);
						expect(extra).eql('hello');
						done();
					}
				});
				var p = new P({c:3},'hello');

			});
			
		});
		describe('on destruction', function () {
			it('should be called when swapping root parcels', function (done) {
				var P1 = Parcel.subClass({
					destroy: function () {
						done();
					}
				});
				v.rootApp(P1);
				v.rootApp(Parcel);
			});
			it('should be chained', function (done) {
				var P2 = Parcel.subClass({
					destroy: function () {
						done();
					}
				});
				var P1 = Parcel.subClass({
					init: function () {
						this.p2 = new P2();
					}
				});
				v.rootApp(P1);
				v.rootApp(Parcel);
			});
			it('should handle arrays of sub-parcels', function () {
				var count = 0;
				var P2 = Parcel.subClass({
					destroy: function () {
						count++;
					}
				});
				var P1 = Parcel.subClass({
					
					init: function () {
						this.subP = [];
						for (var i = 0; i < 5; i++)  {
							this.subP[i] = new P2();
						}
					}
				});
				v.rootApp(P1);
				v.rootApp(Parcel);
				expect(count).eql(5);
					
			});
			it('should run in its own context', function (done) {
				var P2 = Parcel.subClass({
					a: 4,
					destroy: function () {
						expect(this.a).eql(4);
						done();
					}
				});
				var P1 = Parcel.subClass({
					init: function () {
						this.p2 = new P2();
					}
				});
				v.rootApp(P1);
				v.rootApp(Parcel);
			});
		});
						
					
	});

})(global.window || require('fake-dom')());

