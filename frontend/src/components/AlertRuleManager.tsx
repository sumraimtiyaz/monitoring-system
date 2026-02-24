import { useState, useCallback } from 'react'
import { api, AlertRuleOut } from '../api/client'
import { usePolling } from '../hooks/usePolling'
import { Trash2, Plus, SlidersHorizontal } from 'lucide-react'

interface Props {
  serviceId: string
  availableMetrics: string[]
}

export function AlertRuleManager({ serviceId, availableMetrics }: Props) {
  const fetcher = useCallback(() => api.getAlertRules(serviceId), [serviceId])
  const { data: rules, refetch } = usePolling<AlertRuleOut[]>(fetcher, 10000)

  const [form, setForm] = useState({
    metric_name: availableMetrics[0] ?? 'cpu',
    operator: '>',
    threshold: 80,
    consecutive_required: 3,
  })
  const [creating, setCreating] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const handleCreate = async () => {
    setCreating(true)
    try {
      await api.createAlertRule({ service_id: serviceId, ...form })
      await refetch()
      setShowForm(false)
    } catch (e: any) {
      alert(e.message)
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (ruleId: string) => {
    await api.deleteAlertRule(ruleId)
    await refetch()
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-300 flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4 text-brand-500" /> Alert Rules
        </h3>
        <button className="btn-primary" onClick={() => setShowForm(v => !v)}>
          <Plus className="w-3.5 h-3.5" /> New Rule
        </button>
      </div>

      {showForm && (
        <div className="mb-4 p-4 bg-gray-800/60 rounded-lg border border-gray-700 flex flex-wrap gap-3 items-end">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Metric</label>
            <select
              className="input"
              value={form.metric_name}
              onChange={e => setForm(f => ({ ...f, metric_name: e.target.value }))}
            >
              {(availableMetrics.length > 0 ? availableMetrics : ['cpu', 'memory', 'latency']).map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Condition</label>
            <select className="input" value={form.operator}
              onChange={e => setForm(f => ({ ...f, operator: e.target.value }))}>
              <option value=">">&gt; (above)</option>
              <option value="<">&lt; (below)</option>
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Threshold</label>
            <input type="number" className="input w-24" value={form.threshold}
              onChange={e => setForm(f => ({ ...f, threshold: parseFloat(e.target.value) }))} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Consecutive</label>
            <input type="number" className="input w-20" value={form.consecutive_required} min={1}
              onChange={e => setForm(f => ({ ...f, consecutive_required: parseInt(e.target.value) }))} />
          </div>
          <button className="btn-primary" onClick={handleCreate} disabled={creating}>
            {creating ? 'Creating…' : 'Create'}
          </button>
          <button className="btn-ghost" onClick={() => setShowForm(false)}>Cancel</button>
        </div>
      )}

      {!rules || rules.length === 0 ? (
        <p className="text-sm text-gray-600 text-center py-4">No alert rules configured</p>
      ) : (
        <div className="divide-y divide-gray-800">
          {rules.map(r => (
            <div key={r.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-white">
                  {r.metric_name} <span className="text-gray-400">{r.operator}</span> {r.threshold}
                </p>
                <p className="text-xs text-gray-500">
                  {r.consecutive_required} consecutive · Count: {r.consecutive_count}/{r.consecutive_required}
                </p>
              </div>
              <button
                onClick={() => handleDelete(r.id)}
                className="p-1.5 text-gray-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
