/*global describe, it */

(function (window) {

    "use strict";
    var expect = require('chai').expect,
        should = require('chai').should(),

        Event = require('event-dom')(window),
        Parcel = require('../parcel'),
        vdom = require('virtual-dom')(window),
        ParcelEvents = require('../events.js')(window),

		document = window.document,

        EMIT_CLICK_EVENT, EMIT_FOCUS_EVENT, EMIT_KEY_EVENT, buttonnode, divnode, parcelnode;

        require('lang-ext');

console.info('The after-method from ParcelEvent:');
console.info(ParcelEvents.after);

Parcel.mergePrototypes(ParcelEvents);
var parcel = new Parcel();

console.info('The ParcelEvent\'s after-method at an Parcel-instance:');
console.info(parcel.after);
/*

    // ITSA.render = vdom.render;
    // ITSA.rootApp = vdom.rootApp;
    Parcel.vNode = vdom.vNode;
    EMIT_CLICK_EVENT = function(target) {
        if (!window) {
            return;
        }
        var customEvent,
            type = 'click',
            bubbles = true, //all mouse events bubble
            cancelable = false,
            view = window,
            detail = 1,  //number of mouse clicks must be at least one
            screenX = 0,
            screenY = 0,
            clientX = 0,
            clientY = 0,
            ctrlKey = false,
            altKey = false,
            shiftKey = false,
            metaKey = false,
            button = 0,
            relatedTarget = null;

        if (document.createEvent) {
            customEvent = document.createEvent('MouseEvents');
            customEvent.initMouseEvent(type, bubbles, cancelable, view, detail,
                                     screenX, screenY, clientX, clientY,
                                     ctrlKey, altKey, shiftKey, metaKey,
                                     button, relatedTarget);
            //fire the event
            target.dispatchEvent(customEvent);

        }
        else if (document.createEventObject) { //IE
            //create an IE event object
            customEvent = document.createEventObject();
            //assign available properties
            customEvent.bubbles = bubbles;
            customEvent.cancelable = cancelable;
            customEvent.view = view;
            customEvent.detail = detail;
            customEvent.screenX = screenX;
            customEvent.screenY = screenY;
            customEvent.clientX = clientX;
            customEvent.clientY = clientY;
            customEvent.ctrlKey = ctrlKey;
            customEvent.altKey = altKey;
            customEvent.metaKey = metaKey;
            customEvent.shiftKey = shiftKey;
            //fix button property for IE's wacky implementation
            switch(button){
                case 0:
                    customEvent.button = 1;
                    break;
                case 1:
                    customEvent.button = 4;
                    break;
                case 2:
                    //leave as is
                    break;
                default:
                    customEvent.button = 0;
            }
            customEvent.relatedTarget = relatedTarget;
            //fire the event
            target.fireEvent('onclick', customEvent);
        }
    };

    describe('Custom Events', function () {

        // Code to execute before every test.
        beforeEach(function() {
            parcelnode = document.createElement('div');
            document.body.appendChild(parcelnode);
        });

        // Code to execute after every test.
        afterEach(function() {
            Event.detachAll();
            Event.undefAllEvents();
            document.body.removeChild(parcelnode);
        });

        it('event-subscription', function (done) {
            var ul, firstli, buttonVnode, buttonNode;
            var Menu = Parcel.subClass({
                init: function() {
                    console.info(this.after.toString());
                    this.after('red:save', function() {
                        done();
                    });
                }
            });
            vdom.rootApp(Menu, parcelnode);
            Event.emit('red:save');
        });

        it('right context', function (done) {
            var ul, firstli, buttonVnode, buttonNode;
            var Menu = Parcel.subClass({
                init: function() {
                    this.after('red:save', this.afterclick);
                },
                afterclick: function() {
                    done();
                }
            });
            vdom.rootApp(Menu, parcelnode);
            Event.emit('red:save');
        });

        it('set instance emitter', function () {
            var Menu = Parcel.subClass();
            var parcel = new Menu({value: 10});
            parcel.defineEmitter('parcel1');
            Event.after('parcel1:save', function(e) {
                expect(e.target.value).to.eql(10);
            }, Event);
            parcel.emit('save');
        });

        it('set instance emitter multiple Parcels', function () {
            var Menu, count, parcel1, parcel2;
            count = 0;
            Menu = Parcel.subClass();
            parcel1 = new Menu({value: 10});
            parcel2 = new Menu({value: 20});
            parcel1.defineEmitter('parcel1');
            parcel2.defineEmitter('parcel2');
            Event.after('parcel1:save', function(e) {
                expect(e.target.value).to.eql(10);
                count += 1;
            });
            Event.after('parcel2:save', function(e) {
                expect(e.target.value).to.eql(20);
                count += 2;
            });
            parcel1.emit('save');
            parcel2.emit('save');
            expect(count).to.eql(3);
        });

        it('set Class-emitter', function () {
            var Menu = Parcel.subClass();
            var parcel = new Menu({value: 10});
            Menu.mergePrototypes(Event.Emitter('parcel1'));
            Event.after('parcel1:save', function(e) {
                expect(e.target.value).to.eql(10);
            });
            parcel.emit('save');
        });

        it('set Class-emitter multiple Parcels', function () {
            var Menu, count, parcel1, parcel2;
            count = 0;
            Menu = Parcel.subClass();
            parcel1 = new Menu({value: 10});
            parcel2 = new Menu({value: 20});
            Menu.mergePrototypes(Event.Emitter('parcel1'));
            Event.after('parcel1:save', function(e) {
                count += 1;
                expect(e.target.value).to.eql(10*count);
            });
            parcel1.emit('save');
            parcel2.emit('save');
            expect(count).to.eql(2);
        });

        it('set Class-emitter multiple Parcels and overrule on instance', function () {
            var Menu, count, parcel1, parcel2;
            count = 0;
            Menu = Parcel.subClass();
            parcel1 = new Menu({value: 10});
            parcel2 = new Menu({value: 20});
            Menu.mergePrototypes(Event.Emitter('parcel1'));
            parcel2.defineEmitter('parcel2');
            Event.after('parcel1:save', function(e) {
                expect(e.target.value).to.eql(10);
                count += 1;
            });
            Event.after('parcel2:save', function(e) {
                expect(e.target.value).to.eql(20);
                count += 2;
            });
            parcel1.emit('save');
            parcel2.emit('save');
            expect(count).to.eql(3);
        });

    });

    describe('DOM Events', function () {

        // Code to execute before the tests inside this describegroup.
        before(function() {
            divnode = document.createElement('div');
            divnode.id = 'divcont';
            divnode.style = 'position: absolute; left: -1000px; top: -1000px;';
            buttonnode = document.createElement('button');
            buttonnode.id = 'buttongo';
            buttonnode.className = 'buttongoclass';
            divnode.appendChild(buttonnode);
            document.body.appendChild(divnode);
        });

        // Code to execute after the tests inside this describegroup.
        after(function() {
            document.body.removeChild(divnode);
        });

        // Code to execute before every test.
        beforeEach(function() {
            parcelnode = document.createElement('div');
            divnode.appendChild(parcelnode);
        });

        // Code to execute after every test.
        afterEach(function() {
            Event.detachAll();
            Event.undefAllEvents();
            divnode.removeChild(parcelnode);
        });

        it('event-subscription', function (done) {
            var ul, firstli, buttonVnode, buttonNode;
            var Menu = Parcel.subClass({
                init: function() {
                    this.after('click', function() {
                        done();
                    },
                    'button');
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var menu = vdom.rootApp(Menu, parcelnode, {
                items:[
                    {label: 'Home'},
                    {label: 'Users'},
                    {label: 'Groups'}
                ]
            });
            ul = menu._pNode.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
        });

        it('event-subscription on parcel', function (done) {
            var ul, firstli, buttonVnode, buttonNode;
            var Menu = Parcel.subClass({
                init: function() {
                    this.after('click', function() {
                        done();
                    });
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var menu = vdom.rootApp(Menu, parcelnode, {
                items:[
                    {label: 'Home'},
                    {label: 'Users'},
                    {label: 'Groups'}
                ]
            });
            ul = menu._pNode.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
        });

        it('right context when subscribed on parcel', function (done) {
            var ul, firstli, buttonVnode, buttonNode;
            var Menu = Parcel.subClass({
                init: function() {
                    this.after('click', this.afterclick);
                },
                afterclick: function() {
                    done();
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var menu = vdom.rootApp(Menu, parcelnode, {
                items:[
                    {label: 'Home'},
                    {label: 'Users'},
                    {label: 'Groups'}
                ]
            });
            ul = menu._pNode.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
        });

        it('right context', function (done) {
            var ul, firstli, buttonVnode, buttonNode;
            var Menu = Parcel.subClass({
                init: function() {
                    this.after('click', this.afterclick, 'button');
                },
                afterclick: function() {
                    done();
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            ul = menu._pNode.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
        });

        it('preventing event', function (done) {
            var ul, firstli, buttonVnode, buttonNode;
            var Menu = Parcel.subClass({
                init: function() {
                    this.before('click', function(e) {
                        e.preventDefault();
                    },
                    'button');
                    this.after('click', function() {
                        done(new Error('event should not happen'));
                    },
                    'button');
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var menu = vdom.rootApp(Menu, parcelnode, {
                items:[
                    {label: 'Home'},
                    {label: 'Users'},
                    {label: 'Groups'}
                ]
            });
            ul = menu._pNode.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
            // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
            // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
            setTimeout(done, 50);
        });

        it('halt event', function (done) {
            var ul, firstli, buttonVnode, buttonNode;
            var Menu = Parcel.subClass({
                init: function() {
                    this.before('click', function(e) {
                        e.halt();
                    },
                    'button');
                    this.after('click', function() {
                        done(new Error('event should not happen'));
                    },
                    'button');
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var menu = vdom.rootApp(Menu, parcelnode, {
                items:[
                    {label: 'Home'},
                    {label: 'Users'},
                    {label: 'Groups'}
                ]
            });
            ul = menu._pNode.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
            // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
            // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
            setTimeout(done, 50);
        });

        it('stopPropagation', function (done) {
            var ul, firstli, buttonVnode, buttonNode, count=0;
            var Menu = Parcel.subClass({
                init: function() {
                    this.before('click', function(e) {
                        done(new Error('event on parcel should not happen'));
                    });
                    this.before('click', function(e) {
                        done(new Error('event on ul should not happen'));
                    },
                    'ul');
                    this.before('click', function(e) {
                        expect(count).to.eql(1);
                        count += 2;
                    },
                    'li');
                    this.before('click', function(e) {
                        expect(count).to.eql(3);
                        e.stopPropagation();
                        count += 4;
                    },
                    'li');
                    this.before('click', function(e) {
                        expect(count).to.eql(7);
                        count += 8;
                    },
                    'li');
                    this.before('click', function(e) {
                        expect(count).to.eql(0);
                        count += 1;
                    },
                    'button');
                    this.after('click', function() {
                        expect(count).to.eql(15);
                        done();
                    },
                    'button');
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var menu = vdom.rootApp(Menu, parcelnode, {
                items:[
                    {label: 'Home'},
                    {label: 'Users'},
                    {label: 'Groups'}
                ]
            });
            ul = menu._pNode.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
        });

        it('stopImmediatePropagation', function (done) {
            var ul, firstli, buttonVnode, buttonNode, count=0;
            var Menu = Parcel.subClass({
                init: function() {
                    this.before('click', function(e) {
                        done(new Error('event on parcel should not happen'));
                        count += 8;
                    });
                    this.before('click', function(e) {
                        done(new Error('event on ul should not happen'));
                        count += 4;
                    },
                    'ul');
                    this.before('click', function(e) {
                        expect(count).to.eql(1);
                        count += 2;
                    },
                    'li');
                    this.before('click', function(e) {
                        expect(count).to.eql(3);
                        e.stopImmediatePropagation();
                        count += 4;
                    },
                    'li');
                    this.before('click', function(e) {
                        done(new Error('event on li should not happen'));
                    },
                    'li');
                    this.before('click', function(e) {
                        expect(count).to.eql(0);
                        count += 1;
                    },
                    'button');
                    this.after('click', function() {
                        expect(count).to.eql(7);
                        done();
                    },
                    'button');
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var menu = vdom.rootApp(Menu, parcelnode, {
                items:[
                    {label: 'Home'},
                    {label: 'Users'},
                    {label: 'Groups'}
                ]
            });
            ul = menu._pNode.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
        });

    });

    describe('DOM Events with multiple Parcels', function () {
        // Code to execute before the tests inside this describegroup.
        before(function() {
            divnode = document.createElement('div');
            divnode.id = 'divcont';
            divnode.style = 'position: absolute; left: -1000px; top: -1000px;';
            buttonnode = document.createElement('button');
            buttonnode.id = 'buttongo';
            buttonnode.className = 'buttongoclass';
            divnode.appendChild(buttonnode);
            document.body.appendChild(divnode);
        });

        // Code to execute after the tests inside this describegroup.
        after(function() {
            document.body.removeChild(divnode);
        });

        // Code to execute before every test.
        beforeEach(function() {
            parcelnode = document.createElement('div');
            divnode.appendChild(parcelnode);
        });

        // Code to execute after every test.
        afterEach(function() {
            Event.detachAll();
            Event.undefAllEvents();
            divnode.removeChild(parcelnode);
        });

        it('event-subscription', function (done) {
            var ul, firstli, buttonVnode, buttonNode, count = 0;
            var Menu = Parcel.subClass({
                init: function() {
                    this.after('click', function() {
                        count++;
                    },
                    'button');
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });

            var WebApp = Parcel.subClass({
                view: function () {
                    return [
                        new Menu({
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        }),
                        new Menu({
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        })
                    ];
                }
            });
            var webApp = vdom.rootApp(WebApp, parcelnode);
            var menu = webApp._pNode.children[0];

            ul = menu.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
            // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
            // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
            setTimeout(function() {
                expect(count).to.eql(1);
                done();
            }, 50);
        });

        it('event-subscription on parcel', function (done) {
            var ul, firstli, buttonVnode, buttonNode, count = 0;
            var Menu = Parcel.subClass({
                init: function() {
                    this.after('click', function() {
                        count++;
                    });
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var WebApp = Parcel.subClass({
                view: function () {
                    return [
                        new Menu({
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        }),
                        new Menu({
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        })
                    ];
                }
            });
            var webApp = vdom.rootApp(WebApp, parcelnode);
            var menu = webApp._pNode.children[0];

            ul = menu.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
            // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
            // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
            setTimeout(function() {
                expect(count).to.eql(1);
                done();
            }, 50);
        });

        it('event-subscription on parcel and parcelnode', function (done) {
            var ul, firstli, buttonVnode, buttonNode, count = 0;
            var Menu = Parcel.subClass({
                init: function() {
                    this.after('click', function() {
                        expect(count).to.eql(1);
                        count+=2;
                    });
                    this.after('click', function() {
                        expect(count).to.eql(0);
                        count+=1;
                    }, 'button');
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var WebApp = Parcel.subClass({
                view: function () {
                    return [
                        new Menu({
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        }),
                        new Menu({
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        })
                    ];
                }
            });
            var webApp = vdom.rootApp(WebApp, parcelnode);
            var menu = webApp._pNode.children[0];

            ul = menu.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
            // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
            // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
            setTimeout(function() {
                expect(count).to.eql(3);
                done();
            }, 50);
        });

        it('right context when subscribed on parcel', function (done) {
            var ul, firstli, buttonVnode, buttonNode, count = 0;
            var Menu = Parcel.subClass({
                init: function() {
                    this.after('click', function() {
                        expect(this.identifier).to.eql(1);
                        count++;
                    });
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var WebApp = Parcel.subClass({
                view: function () {
                    return [
                        new Menu({
                            identifier: 1,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        }),
                        new Menu({
                            identifier: 2,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        })
                    ];
                }
            });
            var webApp = vdom.rootApp(WebApp, parcelnode);
            var menu = webApp._pNode.children[0];

            ul = menu.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
            // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
            // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
            setTimeout(function() {
                expect(count).to.eql(1);
                done();
            }, 50);
        });

        it('right context', function (done) {
            var ul, firstli, buttonVnode, buttonNode, count = 0;
            var Menu = Parcel.subClass({
                init: function() {
                    this.after('click', function() {
                        expect(this.identifier).to.eql(1);
                        count++;
                    }, 'button');
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var WebApp = Parcel.subClass({
                view: function () {
                    return [
                        new Menu({
                            identifier: 1,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        }),
                        new Menu({
                            identifier: 2,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        })
                    ];
                }
            });
            var webApp = vdom.rootApp(WebApp, parcelnode);
            var menu = webApp._pNode.children[0];

            ul = menu.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
            // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
            // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
            setTimeout(function() {
                expect(count).to.eql(1);
                done();
            }, 50);
        });

        it('preventing event', function (done) {
            var ul, firstli, buttonVnode, buttonNode, count = 0;
            var Menu = Parcel.subClass({
                init: function() {
                    this.before('click', function(e) {
                        count++;
                        e.preventDefault();
                    }, 'button');
                    this.after('click', function() {
                        done(new Error('after click should get invoked'));
                    });
                    this.after('click', function() {
                        done(new Error('after click should get invoked'));
                    }, 'button');
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var WebApp = Parcel.subClass({
                view: function () {
                    return [
                        new Menu({
                            identifier: 1,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        }),
                        new Menu({
                            identifier: 2,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        })
                    ];
                }
            });
            var webApp = vdom.rootApp(WebApp, parcelnode);
            var menu = webApp._pNode.children[0];

            ul = menu.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
            // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
            // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
            setTimeout(function() {
                expect(count).to.eql(1);
                done();
            }, 50);
        });

        it('preventing event on parcel', function (done) {
            var ul, firstli, buttonVnode, buttonNode, count = 0;
            var Menu = Parcel.subClass({
                init: function() {
                    this.before('click', function(e) {
                        count++;
                        e.preventDefault();
                    });
                    this.after('click', function() {
                        done(new Error('after click should get invoked'));
                    });
                    this.after('click', function() {
                        done(new Error('after click should get invoked'));
                    }, 'button');
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var WebApp = Parcel.subClass({
                view: function () {
                    return [
                        new Menu({
                            identifier: 1,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        }),
                        new Menu({
                            identifier: 2,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        })
                    ];
                }
            });
            var webApp = vdom.rootApp(WebApp, parcelnode);
            var menu = webApp._pNode.children[0];

            ul = menu.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
            // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
            // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
            setTimeout(function() {
                expect(count).to.eql(1);
                done();
            }, 50);
        });

        it('preventing event', function (done) {
            var ul, firstli, buttonVnode, buttonNode, count = 0;
            var Menu = Parcel.subClass({
                init: function() {
                    this.before('click', function(e) {
                        count++;
                        e.halt();
                    }, 'button');
                    this.after('click', function() {
                        done(new Error('after click should get invoked'));
                    });
                    this.after('click', function() {
                        done(new Error('after click should get invoked'));
                    }, 'button');
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var WebApp = Parcel.subClass({
                view: function () {
                    return [
                        new Menu({
                            identifier: 1,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        }),
                        new Menu({
                            identifier: 2,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        })
                    ];
                }
            });
            var webApp = vdom.rootApp(WebApp, parcelnode);
            var menu = webApp._pNode.children[0];

            ul = menu.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
            // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
            // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
            setTimeout(function() {
                expect(count).to.eql(1);
                done();
            }, 50);
        });

        it('preventing event on parcel', function (done) {
            var ul, firstli, buttonVnode, buttonNode, count = 0;
            var Menu = Parcel.subClass({
                init: function() {
                    this.before('click', function(e) {
                        count++;
                        e.halt();
                    });
                    this.after('click', function() {
                        done(new Error('after click should get invoked'));
                    });
                    this.after('click', function() {
                        done(new Error('after click should get invoked'));
                    }, 'button');
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var WebApp = Parcel.subClass({
                view: function () {
                    return [
                        new Menu({
                            identifier: 1,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        }),
                        new Menu({
                            identifier: 2,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        })
                    ];
                }
            });
            var webApp = vdom.rootApp(WebApp, parcelnode);
            var menu = webApp._pNode.children[0];

            ul = menu.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
            // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
            // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
            setTimeout(function() {
                expect(count).to.eql(1);
                done();
            }, 50);
        });

        it('event on childnode with id on pnode', function (done) {
            var ul, firstli, buttonVnode, buttonNode, count = 0;
            var Menu = Parcel.subClass({
                init: function() {
                    this.after('click', function() {
                        expect(count).to.eql(1);
                        count += 2;
                    }, '#liId');
                    this.after('click', function() {
                        expect(count).to.eql(0);
                        count += 1;
                    }, 'button');
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var WebApp = Parcel.subClass({
                view: function () {
                    return [
                        new Menu({
                            identifier: 1,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        }),
                        new Menu({
                            identifier: 2,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        })
                    ];
                }
            });
            var webApp = vdom.rootApp(WebApp, parcelnode);
            var menu = webApp._pNode.children[0];

            ul = menu.children[0];
            firstli = ul.children[0];
            firstli.node.id = 'liId';
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
            EMIT_CLICK_EVENT(ul.node); // should have no subscriber
            // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
            // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
            setTimeout(function() {
                expect(count).to.eql(3);
                done();
            }, 50);
        });

        it('event on childnode with id on vnode', function (done) {
            var ul, firstli, buttonVnode, buttonNode, count = 0;
            var Menu = Parcel.subClass({
                init: function() {
                    this.after('click', function() {
                        expect(count).to.eql(0);
                        count++;
                    }, '#buttonId');
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var WebApp = Parcel.subClass({
                view: function () {
                    return [
                        new Menu({
                            identifier: 1,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        }),
                        new Menu({
                            identifier: 2,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        })
                    ];
                }
            });
            var webApp = vdom.rootApp(WebApp, parcelnode);
            var menu = webApp._pNode.children[0];

            ul = menu.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            buttonNode.id = 'buttonId';
            EMIT_CLICK_EVENT(buttonNode);
            EMIT_CLICK_EVENT(ul.node); // should have no subscriber
            // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
            // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
            setTimeout(function() {
                expect(count).to.eql(1);
                done();
            }, 50);
        });

        it('stopPropagation', function (done) {
            var ul, firstli, buttonVnode, buttonNode, count=0;
            var Menu = Parcel.subClass({
                init: function() {
                    this.before('click', function(e) {
                        done(new Error('event on parcel should not happen'));
                    });
                    this.before('click', function(e) {
                        done(new Error('event on ul should not happen'));
                    },
                    'ul');
                    this.before('click', function(e) {
                        expect(count).to.eql(1);
                        count += 2;
                    },
                    'li');
                    this.before('click', function(e) {
                        expect(count).to.eql(3);
                        e.stopPropagation();
                        count += 4;
                    },
                    'li');
                    this.before('click', function(e) {
                        expect(count).to.eql(7);
                        count += 8;
                    },
                    'li');
                    this.before('click', function(e) {
                        expect(count).to.eql(0);
                        count += 1;
                    },
                    'button');
                    this.after('click', function() {
                        expect(count).to.eql(15);
                        count+=16;
                    },
                    'button');
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var WebApp = Parcel.subClass({
                view: function () {
                    return [
                        new Menu({
                            identifier: 1,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        }),
                        new Menu({
                            identifier: 2,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        })
                    ];
                }
            });
            var webApp = vdom.rootApp(WebApp, parcelnode);
            var menu = webApp._pNode.children[0];

            ul = menu.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
            // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
            // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
            setTimeout(function() {
                expect(count).to.eql(31);
                done();
            }, 50);
        });

        it('stopPropagation on parcel', function (done) {
            var ul, firstli, buttonVnode, buttonNode, count=0;
            var Menu = Parcel.subClass({
                init: function() {
                    this.before('click', function(e) {
                        expect(count).to.eql(3);
                        count += 4;
                    },
                    'ul');
                    this.before('click', function(e) {
                        expect(count).to.eql(1);
                        count += 2;
                    },
                    'li');
                    this.before('click', function(e) {
                        expect(count).to.eql(7);
                        e.stopPropagation();
                        count += 8;
                    });
                    this.before('click', function(e) {
                        expect(count).to.eql(0);
                        count += 1;
                    },
                    'button');
                    this.before('click', function(e) {
                        expect(count).to.eql(15);
                        count += 16;
                    });

                    this.after('click', function() {
                        expect(count).to.eql(15);
                        count+=32;
                    },
                    'button');
                    this.after('click', function(e) {
                        expect(count).to.eql(47);
                        count+=64;
                    });
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var WebApp = Parcel.subClass({
                view: function () {
                    return [
                        new Menu({
                            identifier: 1,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        }),
                        new Menu({
                            identifier: 2,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        })
                    ];
                }
            });
            var webApp = vdom.rootApp(WebApp, parcelnode);
            var menu = webApp._pNode.children[0];

            ul = menu.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
            // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
            // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
            setTimeout(function() {
                expect(count).to.eql(47);
                done();
            }, 50);
        });

        it('stopImmediatePropagation', function (done) {
            var ul, firstli, buttonVnode, buttonNode, count=0;
            var Menu = Parcel.subClass({
                init: function() {
                    this.before('click', function(e) {
                        done(new Error('event on parcel should not happen'));
                        count += 8;
                    });
                    this.before('click', function(e) {
                        done(new Error('event on ul should not happen'));
                        count += 4;
                    },
                    'ul');
                    this.before('click', function(e) {
                        expect(count).to.eql(1);
                        count += 2;
                    },
                    'li');
                    this.before('click', function(e) {
                        expect(count).to.eql(3);
                        e.stopImmediatePropagation();
                        count += 4;
                    },
                    'li');
                    this.before('click', function(e) {
                        done(new Error('event on li should not happen'));
                    },
                    'li');
                    this.before('click', function(e) {
                        expect(count).to.eql(0);
                        count += 1;
                    },
                    'button');
                    this.after('click', function() {
                        expect(count).to.eql(7);
                        count+=8;
                    },
                    'button');
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var WebApp = Parcel.subClass({
                view: function () {
                    return [
                        new Menu({
                            identifier: 1,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        }),
                        new Menu({
                            identifier: 2,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        })
                    ];
                }
            });
            var webApp = vdom.rootApp(WebApp, parcelnode);
            var menu = webApp._pNode.children[0];

            ul = menu.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
            // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
            // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
            setTimeout(function() {
                expect(count).to.eql(15);
                done();
            }, 50);
        });

        it('stopImmediatePropagation on parcel', function (done) {
            var ul, firstli, buttonVnode, buttonNode, count=0;
            var Menu = Parcel.subClass({
                init: function() {
                    this.before('click', function(e) {
                        expect(count).to.eql(3);
                        count += 4;
                    },
                    'ul');
                    this.before('click', function(e) {
                        expect(count).to.eql(1);
                        count += 2;
                    },
                    'li');
                    this.before('click', function(e) {
                        expect(count).to.eql(7);
                        e.stopImmediatePropagation();
                        count += 8;
                    });
                    this.before('click', function(e) {
                        expect(count).to.eql(0);
                        count += 1;
                    },
                    'button');
                    this.before('click', function(e) {
                        done('beforeclick on parcel should not be invoked');
                    });

                    this.after('click', function() {
                        expect(count).to.eql(15);
                        count+=16;
                    },
                    'button');
                    this.after('click', function(e) {
                        done('afterclick on parcel should not be invoked');
                    });
                },
                view: function() {
                    var v = Parcel.vNode;
                    return v('ul',this.items.map(function(item) {
                        return v('li', [v('button', item.label)]);
                    }));
                }
            });
            var WebApp = Parcel.subClass({
                view: function () {
                    return [
                        new Menu({
                            identifier: 1,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        }),
                        new Menu({
                            identifier: 2,
                            items:[
                                {label: 'Home'},
                                {label: 'Users'},
                                {label: 'Groups'}
                            ]
                        })
                    ];
                }
            });
            var webApp = vdom.rootApp(WebApp, parcelnode);
            var menu = webApp._pNode.children[0];

            ul = menu.children[0];
            firstli = ul.children[0];
            buttonVnode = firstli.children[0];
            buttonNode = buttonVnode.node;
            EMIT_CLICK_EVENT(buttonNode);
            // CAUTIOUS: do not set timeout to 0 --> IE9 puts the after-dom-events
            // a bit later in the js-stack: timeOut of 0 would happen before the after-evens
            setTimeout(function() {
                expect(count).to.eql(15);
                done();
            }, 50);
        });

    });
*/

}(global.window || require('fake-dom')));