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

    function ArrayLoopNode(n) {
        RED.nodes.createNode(this, n);
        var node = this;

        node.key = n.key;
        node.keyType = n.keyType;
        node.array = n.array;
        node.arrayType = n.arrayType;
        node.reset = n.reset;
        node.resetValue = n.resetValue;

        this.on('input', function (msg) {
            let key = RED.util.evaluateNodeProperty(node.key, node.keyType, node, msg);
            let array = RED.util.evaluateNodeProperty(node.array, node.arrayType, node, msg);

            if (!Array.isArray(array)) {
                let text = RED._('array-loop.errors.arraynotarray') + array;
                sendErrorMessage(node, text);
            }

            if (key === void 0 || key === null || key === '') {
                // initialize
                key = 0;
            } else {
                key += 1;
            }

            setProperty(node, msg, node.key, node.keyType, key);
            setProperty(node, msg, node.array, node.arrayType, array);

            let isLoop = array.length > key;
            if (isLoop) {
                // run in loop
                node.status({
                    fill: 'blue',
                    shape: 'dot',
                    text: 'loop'
                });
                msg.payload = array[key];
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
                    setProperty(node, msg, node.key, node.keyType, resetValue);
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

    RED.nodes.registerType('array-loop', ArrayLoopNode);
}
