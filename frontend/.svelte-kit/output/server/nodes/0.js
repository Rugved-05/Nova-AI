

export const index = 0;
let component_cache;
export const component = async () => component_cache ??= (await import('../entries/pages/_layout.svelte.js')).default;
export const universal = {
  "ssr": false,
  "prerender": false
};
export const universal_id = "src/routes/+layout.js";
export const imports = ["_app/immutable/nodes/0.BuDY2LBy.js","_app/immutable/chunks/CUN6wchY.js","_app/immutable/chunks/IImCMv-Z.js","_app/immutable/chunks/BurXaNgX.js"];
export const stylesheets = ["_app/immutable/assets/0.CAACYc6o.css"];
export const fonts = [];
