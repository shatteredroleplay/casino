import { Index, Show } from 'solid-js'
import { config, idOf, valueOf } from './config'

// ways and stackways games: a cell that a crate or a stackways opened holds 2 to 10 of a paying symbol (or wilds) on top of
// each other, the reel grows to fit them
const stacks = new Set(config.kind === 'ways' || config.kind === 'stack' ? [...config.symbols.filter(s => s.pays).map(s => s.id), 'xwild'] : [])

// coins show what they are worth in times the bet, wilds with a multiplier show it, an unopened stackways how many it holds
const coins = new Set(config.symbols.filter(s => s.coin).map(s => s.id))
const multiplied = new Set(config.symbols.filter(s => s.wild && s.valued).map(s => s.id))
const tiles = new Set(['stack', 'reveal'])

export default function Cell(props: { cell: string }) {
  const id = () => idOf(props.cell)
  const n = () => (stacks.has(id()) && valueOf(props.cell)) || 1
  const label = () =>
    coins.has(id()) || (multiplied.has(id()) && valueOf(props.cell) > 1) ? `×${valueOf(props.cell)}` : tiles.has(id()) && config.kind === 'stack' ? `${valueOf(props.cell)}` : ''
  return (
    <>
      <Show when={label()}>
        <b class="value tag" classList={{ stacked: tiles.has(id()) }}>
          {label()}
        </b>
      </Show>
      {/* ronin: a stack is its symbols piled over each other down the cells it fills, how many it counts as in the corner */}
      <Show
        when={config.kind === 'stack' && n() > 1}
        fallback={
          <Index each={Array.from({ length: n() })}>
            {() => (
              <svg viewBox="0 0 100 100" style={n() > 1 ? { height: `${88 / n()}%` } : undefined}>
                <use href={`#s-${id()}`} />
              </svg>
            )}
          </Index>
        }
      >
        <div class="pile" style={{ '--n': n() - 1 }}>
          <Index each={Array.from({ length: n() })}>
            {(_, i) => (
              <svg viewBox="0 0 100 100" style={{ '--i': i, 'z-index': n() - i }}>
                <use href={`#s-${id()}`} />
              </svg>
            )}
          </Index>
          <b>{n()}×</b>
        </div>
      </Show>
    </>
  )
}
