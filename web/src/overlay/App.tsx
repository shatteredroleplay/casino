import { onMount } from 'solid-js'
import { onMessage, post } from '../shared/nui'
import { setLocale } from '../shared/i18n'
import { setCurrency } from '../shared/format'
import { setAccent } from '../shared/theme'
import { Notifications } from './Notifications'
import { Hints } from './Hints'
import { Prompt } from './Prompt'
import { Input } from './Input'
import { Cashier } from './Cashier'
import { Snackbar } from './Snackbar'
import { ChipHud } from './ChipHud'
import { Admin } from '../admin/Admin'

export const App = () => {
  onMessage('init', (data) => {
    setLocale(data.lang, data.locale ?? {})
    if (data.currency) setCurrency(data.currency)
    if (data.accent) setAccent(data.accent)
  })

  onMount(() => post('ready'))

  return (
    <>
      <ChipHud />
      <Notifications />
      <Hints />
      <Prompt />
      <Input />
      <Cashier />
      <Snackbar />
      <Admin />
    </>
  )
}
