export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set([]),
	mimeTypes: {},
	_: {
		client: {start:"_app/immutable/entry/start.DUl3OQRm.js",app:"_app/immutable/entry/app.DdbzpFks.js",imports:["_app/immutable/entry/start.DUl3OQRm.js","_app/immutable/chunks/CRUUx_lR.js","_app/immutable/chunks/IImCMv-Z.js","_app/immutable/chunks/CK6mn_4X.js","_app/immutable/entry/app.DdbzpFks.js","_app/immutable/chunks/IImCMv-Z.js","_app/immutable/chunks/aYSWzEL-.js","_app/immutable/chunks/CUN6wchY.js","_app/immutable/chunks/CK6mn_4X.js","_app/immutable/chunks/DCSeNEyV.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('./nodes/0.js')),
			__memo(() => import('./nodes/1.js')),
			__memo(() => import('./nodes/2.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
