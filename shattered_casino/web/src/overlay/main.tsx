import { render } from 'solid-js/web'
import '../shared/theme.css'
import './overlay.css'
import '../admin/admin.css'
import { App } from './App'

render(() => <App />, document.getElementById('root')!)

if (import.meta.env.DEV) import('./dev')
