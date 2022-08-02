module.exports = function(RED) {
	function SoapCall(n) {
		RED.nodes.createNode(this, n);
		this.topic = n.topic;
		this.name = n.name;
		this.wsdl = n.wsdl;
		this.server = RED.nodes.getNode(this.wsdl);
		this.method = n.method;
		this.payload = n.payload;
		var node = this;
		this.status({});

		node.on('input', async (msg, send, done) => {
			try {
				const client = await this.server.getClient();
				node.status({ fill: "yellow", shape: "dot", text: "SOAP Request..." });
				if (msg.headers) {
					client.addSoapHeader(msg.headers);
				}

				if (client.hasOwnProperty(node.method)) {
					try {
						msg.payload = (await client[`${node.method}Async`](msg.payload, msg.options))[0];
						node.status({ fill: "green", shape: "dot", text: "SOAP result received" });
						send(msg);
						done();
					} catch (err) {
						node.status({ fill: "red", shape: "dot", text: "Service Call Error: " + err });
						// Preserve error in msg
						msg.response = err.response;
						msg.statusCode = err.response.status;
						done(err.message);
						return;
					}
				} else {
					node.status({ fill: "red", shape: "dot", text: "Method does not exist" });
					node.error("Method does not exist!");
					done(err);
				};
			} catch (err) {
				node.status({ fill: "red", shape: "dot", text: "Could not get client" });
				node.error(err.message);
				done(err.message);
			}
		});
	};
	RED.nodes.registerType("soap request", SoapCall);
}

