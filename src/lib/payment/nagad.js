const { NagadGateway } = require('nagad-payment-gateway');

const config = {
	apiVersion: 'v-0.2.0',
	// baseURL: process.env.BASE_URL,
	// callbackURL: process.env.CALLBACK_URL,
	// merchantID: process.env.MERCHANT_ID,
	// merchantNumber: process.env.MERCHANT_NUMBER,
	// privKey: '.keys/private.key',
	// pubKey: '.keys/public.key',
	isPath: true,
};

const nagad = new NagadGateway(config);

module.exports = nagad;