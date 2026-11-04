/* @refresh reload */
// npm run dev: dev.ts plays the game in the browser with config.lua and shared/slots.lua, in game the url carries the config
if (import.meta.env.DEV) await import('./dev')
// the config is read once, a new one in the url means the page loads again
else addEventListener('hashchange', () => location.reload())
import('./app')
