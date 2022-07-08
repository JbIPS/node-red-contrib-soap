module.exports = function(RED) {
	const soap = require('soap');
	const Cookie = require('soap-cookie');
	function SoapConfig(n) {
		RED.nodes.createNode(this, n);
		this.wsdl = n.wsdl;
		this.wsdlHeader = n.wsdlHeader ? JSON.parse(n.wsdlHeader) : n.wsdlHeader;
		this.auth = n.auth;
		this.user = n.user;
		this.pass = n.pass;
		this.key = n.key;
		this.cert = n.cert;
		this.token = n.token;
		this.method = n.method;

		this.getClient = async () => {
			if (!this.client) {
				var lastFiveChar = this.wsdl.substr(this.wsdl.length - 5);
				if (this.wsdl.indexOf("://") > 0 && lastFiveChar !== '?wsdl') {
					this.wsdl += '?wsdl';
				}
				try {
					this.client = await soap.createClientAsync(this.wsdl, { wsdl_headers: this.wsdlHeader });
					Object.entries(this.wsdlHeader).forEach(([key, value]) => this.client.addHttpHeader(key, value));
					switch (this.auth) {
						case 'basic':
							this.client.setSecurity(new soap.BasicAuthSecurity(this.user, this.pass));
							break;
						case 'certificate':
							this.client.setSecurity(new soap.ClientSSLSecurity(this.key, this.cert, {}));
							break;
						case 'ws':
							this.client.setSecurity(new soap.WSSecurity(this.user, this.pass));
							break;
						case 'token':
							this.client.setSecurity(new soap.BearerSecurity(this.token));
							break;
						case 'cookies':
							const result = await this.client[`${this.method}Async`]({ login: this.user, password: this.pass });
							if (result[0].authenticateReturn) {
								this.client.setSecurity(new Cookie(this.client.lastResponseHeaders));
							} else {
								this.error('Invalid user or password');
								console.error('Invalid user or password');
							}
					}
					return this.client;
				} catch (err) {
					this.error("WSDL Config Error: " + err);
					return;
				}
			} else {
				return this.client;
			}
		}
	}
	RED.nodes.registerType("soap-config", SoapConfig);
}
