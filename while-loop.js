module.exports = function (RED) {
    'use strict';
    const util = require('util');
    const vm = require('vm');

    function sendResults(node, _msgid, msgs) {
        if (msgs == null) {
            return;
        } else if (!util.isArray(msgs)) {
            msgs = [msgs];
        }
        var msgCount = 0;
        for (var m = 0; m < msgs.length; m++) {
            if (msgs[m]) {
                if (!util.isArray(msgs[m])) {
                    msgs[m] = [msgs[m]];
                }
                for (var n = 0; n < msgs[m].length; n++) {
                    var msg = msgs[m][n];
                    if (msg !== null && msg !== undefined) {
                        if (typeof msg === 'object' && !Buffer.isBuffer(msg) && !util.isArray(msg)) {
                            msg._msgid = _msgid;
                            msgCount++;
                        } else {
                            var type = typeof msg;
                            if (type === 'object') {
                                type = Buffer.isBuffer(msg) ? 'Buffer' : (util.isArray(msg) ? 'Array' : 'Date');
                            }
                            node.error(RED._("while-loop.errors.non-message-returned", {
                                type: type
                            }));
                        }
                    }
                }
            }
        }
        if (msgCount > 0) {
            node.send(msgs);
        }
    }

    function setProperty(node, msg, name, type, value) {
        if (type === 'msg') {
            msg[name] = value;
        } else if (type === 'flow') {
            node.context().flow.set(name, value);
        } else if (type === 'global') {
            node.context().global.set(name, value);
        }
    }

    function WhileLoopNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;
        node.condi = n.condi;
        node.time = n.time;
        node.timeType = n.timeType;
        node.limit = n.limit;
        node.limitTime = n.limitTime;

        var sandbox = {
            isLoop: false,
            console: console,
            util: util,
            Buffer: Buffer,
            Date: Date,
            RED: {
                util: RED.util
            },
            __node__: {
                id: node.id,
                name: node.name,
                log: function () {
                    node.log.apply(node, arguments);
                },
                error: function () {
                    node.error.apply(node, arguments);
                },
                warn: function () {
                    node.warn.apply(node, arguments);
                },
                debug: function () {
                    node.debug.apply(node, arguments);
                },
                trace: function () {
                    node.trace.apply(node, arguments);
                },
                send: function (id, msgs) {
                    sendResults(node, id, msgs);
                },
                on: function () {
                    if (arguments[0] === "input") {
                        throw new Error(RED._("while-loop.errors.inputListener"));
                    }
                    node.on.apply(node, arguments);
                },
                status: function () {
                    node.status.apply(node, arguments);
                }
            },
            context: {
                set: function () {
                    node.context().set.apply(node, arguments);
                },
                get: function () {
                    return node.context().get.apply(node, arguments);
                },
                keys: function () {
                    return node.context().keys.apply(node, arguments);
                },
                get global() {
                    return node.context().global;
                },
                get flow() {
                    return node.context().flow;
                }
            },
            flow: {
                set: function () {
                    node.context().flow.set.apply(node, arguments);
                },
                get: function () {
                    return node.context().flow.get.apply(node, arguments);
                },
                keys: function () {
                    return node.context().flow.keys.apply(node, arguments);
                }
            },
            global: {
                set: function () {
                    node.context().global.set.apply(node, arguments);
                },
                get: function () {
                    return node.context().global.get.apply(node, arguments);
                },
                keys: function () {
                    return node.context().global.keys.apply(node, arguments);
                }
            }
        };

        this.on('input', function (msg) {
            let isLoop = true;
            if (node.limit) {
                let time = RED.util.evaluateNodeProperty(node.time, node.timeType, node, msg);
                if (time === void 0 || time === null || time === '') {
                    // initialize
                    time = 0;
                } else {
                    time++;
                }
                setProperty(node, msg, node.time, node.timeType, time);

                isLoop = time < node.limitTime;
                if (!isLoop) {
                    // exit loop
                    node.status({
                        fill: 'grey',
                        shape: 'ring',
                        text: RED._('while-loop.messages.overLimitTime', {'limit': node.limitTime})
                    });
                    node.send(msg);
                }
            }

            if (isLoop) {
                sandbox.msg = msg;
                vm.createContext(sandbox);
                vm.runInContext('isLoop = (' + node.condi + ');', sandbox);
    
                if (sandbox.isLoop) {
                    // run in loop
                    node.status({
                        fill: 'blue',
                        shape: 'dot',
                        text: 'loop'
                    });
                    node.send([null, msg]);
                } else {
                    // exit loop
                    node.status({
                        fill: 'grey',
                        shape: 'ring',
                        text: 'exit loop'
                    });
                    node.send(msg);
                }    
            }
        });

        this.on('close', function () {
            node.status({});
        });
    }

    RED.nodes.registerType('while-loop', WhileLoopNode);
}
