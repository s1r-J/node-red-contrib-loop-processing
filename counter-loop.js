module.exports = function (RED) {
    'use strict';

    function setProperty(node, msg, name, type, value) {
        if (type === 'msg') {
            msg[name] = value;
        } else if (type === 'flow') {
            node.context().flow.set(name, value);
        } else if (type === 'global') {
            node.context().global.set(name, value);
        }
    }

    function sendErrorMessage(node, text) {
        node.status({
            fill: 'red',
            shape: 'ring',
            text: text
        });
        node.error(text, msg);
    }

    function CounterLoopNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;

        node.counter = n.counter;
        node.counterType = n.counterType;
        node.initial = n.initial;
        node.initialType = n.initialType;
        node.operator = n.operator;
        node.termination = n.termination;
        node.terminationType = n.terminationType;
        node.increment = n.increment;
        node.incrementType = n.incrementType;
        node.reset = n.reset;
        node.resetValue = n.resetValue;

        this.on('input', function (msg) {
            let counter = RED.util.evaluateNodeProperty(node.counter, node.counterType, node, msg);
            let initial = RED.util.evaluateNodeProperty(node.initial, node.initialType, node, msg);
            let termination = RED.util.evaluateNodeProperty(node.termination, node.terminationType, node, msg);
            let increment = RED.util.evaluateNodeProperty(node.increment, node.incrementType, node, msg);

            if (typeof initial !== 'number') {
                let text = RED._('counter-loop.errors.initialnotnumber') + initial;
                sendErrorMessage(node, text);
            }
            if (typeof termination !== 'number') {
                let text = RED._('counter-loop.errors.terminationnotnumber') + termination;
                sendErrorMessage(node, text);
            }
            if (typeof increment !== 'number') {
                let text = RED._('counter-loop.errors.incrementnotnumber') + increment;
                sendErrorMessage(node, text);
            }

            if (counter === void 0 || counter === null || counter === '') {
                // initialize
                counter = initial;
            } else {
                counter += increment;
            }

            setProperty(node, msg, node.counter, node.counterType, counter);
            setProperty(node, msg, node.initial, node.initialType, initial);
            setProperty(node, msg, node.termination, node.terminationType, termination);
            setProperty(node, msg, node.increment, node.incrementType, increment);

            let isLoop = false;
            switch (node.operator) {
                case 'lt':
                    isLoop = counter < termination;
                    break;
                case 'lte':
                    isLoop = counter <= termination;
                    break;
                case 'gt':
                    isLoop = counter > termination;
                    break;
                case 'gte':
                    isLoop = counter >= termination;
                    break;
                case 'eq':
                    isLoop = counter == termination;
                    break;
                default:
                    sendErrorMessage(node, RED._('counter-loop.errors.invalidoperator'));
            }
            if (isLoop) {
                // run in loop
                node.status({
                    fill: 'blue',
                    shape: 'dot',
                    text: 'loop'
                });
                node.send([null, msg]);
            } else {
                // exit loop
                if (node.reset) {
                    let resetValue = null;
                    switch (node.resetValue) {
                        case 'value-null':
                            resetValue = null;
                            break;
                        case 'value-undefined':
                            resetValue = undefined;
                            break;
                        case 'value-empty':
                            resetValue = '';
                            break;
                        default:
                            // not come here
                    }
                    setProperty(node, msg, node.counter, node.counterType, resetValue);
                }
                node.status({
                    fill: 'grey',
                    shape: 'ring',
                    text: 'exit loop'
                });
                node.send(msg);
            }
        });

        this.on('close', function () {
            node.status({});
        });
    }
    RED.nodes.registerType('counter-loop', CounterLoopNode);
}
