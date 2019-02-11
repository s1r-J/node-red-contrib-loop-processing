node-red-contrib-loop-processing
====

Node-RED nodes to help a flow looping.

## Description

This module have 2 nodes.

- [counter-loop](#counter-loop)
- [array-loop](#array-loop)

### counter-loop

Using a counter variable, a flow loops like a for-loop.

Set the following inputs:
- property using as the counter variable
- initial value
- terminal value (and operator)
- increment value

If the conditions is true, a flow is sent to the lower output port ('true' outputLabel).  
If false, the flow is sent to the upper output port ('false' outputLabel). 

![array-loop](examples/arrayloop-example.png)

### array-lopp

Until the end of an array, a flow loops. This node is similar to forEach or for-of,
but this node cannot handle an associated array.

Set the following inputs:
- property using as the key variable
- array

If the conditions is true, a flow is sent to the lower output port.  
If false, the flow is sent to the upper output port ('end loop' outputLabel). 

![counter-loop](examples/counterloop-example.png)

## Usage

Example flow is in examples/exmple.json.

## Install

## Licence

[Apache-2.0](http://www.apache.org/licenses/LICENSE-2.0.html)

## Author

[s1r-J](https://github.com/s1r-J)