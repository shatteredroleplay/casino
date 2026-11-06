import { For } from 'solid-js'
import { format } from './config'

// what a single win paid, floating up from where it was won: x, y in px on the board
export type Floating = { x: number; y: number; amount: number; id: number }

let next = 0
export const floating = (x: number, y: number, amount: number): Floating => ({ x, y, amount, id: next++ })

export default function Floats(props: { list: Floating[] }) {
  return (
    <For each={props.list}>
      {f => (
        <b class="float" style={{ left: `${f.x}px`, top: `${f.y}px` }}>
          {format(f.amount)}
        </b>
      )}
    </For>
  )
}
