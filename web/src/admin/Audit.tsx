import { For, Show, createResource, createSignal } from 'solid-js'
import { lang, t } from '../shared/i18n'
import { call } from './api'
import { Empty, Status } from './ui'

type Row = { id: number; time: number; admin_name: string; action: string; target: string; data: string }

const when = (time: number) => new Date(time * 1000).toLocaleString(lang())

export const Audit = () => {
  const [page, setPage] = createSignal(1)
  const [data, { refetch }] = createResource(page, (p) => call<{ page: number; rows: Row[] }>('audit', p))

  return (
    <div class="a-stack">
      <Show when={data()} fallback={<Status loading={data.loading} retry={refetch} />}>
        {(d) => (
          <Show when={d().rows.length} fallback={<Empty text={t('admin.none_yet')} />}>
            <table class="a-table" classList={{ stale: data.loading }}>
              <thead>
                <tr>
                  <th>{t('admin.when')}</th>
                  <th>{t('log.admin')}</th>
                  <th>{t('admin.action')}</th>
                  <th>{t('admin.target')}</th>
                  <th>{t('admin.details')}</th>
                </tr>
              </thead>
              <tbody>
                <For each={d().rows}>
                  {(r) => (
                    <tr>
                      <td class="muted nowrap">{when(r.time)}</td>
                      <td>{r.admin_name}</td>
                      <td>
                        <code>{r.action}</code>
                      </td>
                      <td class="muted">{r.target || '–'}</td>
                      <td class="muted clip" title={r.data || ''}>{r.data || ''}</td>
                    </tr>
                  )}
                </For>
              </tbody>
            </table>
          </Show>
        )}
      </Show>
      <div class="a-pager">
        <button class="btn" disabled={page() <= 1} onClick={() => setPage(page() - 1)}>
          {t('admin.newer')}
        </button>
        <span>{t('admin.page', { n: page() })}</span>
        <button class="btn" disabled={(data()?.rows.length ?? 0) < 50} onClick={() => setPage(page() + 1)}>
          {t('admin.older')}
        </button>
      </div>
    </div>
  )
}
