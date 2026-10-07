import { useRef } from 'react';
import { Plus, Trash2, Upload, Download, FileText, Info } from 'lucide-react';
import { useUIStore } from '../../store';
import { useEngagementStore } from '../../store/engagementStore';
import type { ExpenseItem } from '../../lib/calculations';
import { formatCurrency, formatPercent } from '../../lib/calculations';

const EXPENSE_CATEGORIES: ExpenseItem['category'][] = ['Software', 'Cloud', '3rd Party', 'Other'];

export function ProcurementPage() {
  const { activeProject } = useUIStore();
  const { getExpenses, setExpenses, getAttachments, setAttachments } = useEngagementStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const pid = activeProject?.id ?? '';
  const expenses = getExpenses(pid);
  const attachments = getAttachments(pid);

  const addExpense = () => {
    setExpenses(pid, [...expenses, {
      id: crypto.randomUUID(),
      description: 'New Item',
      category: 'Software',
      cost: 0,
      sell: 0,
      date: new Date().toISOString().split('T')[0],
    }]);
  };

  const updateExpense = (id: string, updates: Partial<ExpenseItem>) => {
    setExpenses(pid, expenses.map(e => e.id === id ? { ...e, ...updates } : e));
  };

  const removeExpense = (id: string) => {
    setExpenses(pid, expenses.filter(e => e.id !== id));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      alert('File too large. Maximum 4MB for storage safety.');
      return;
    }
    const reader = new FileReader();
    reader.onload = ev => {
      const base64 = ev.target?.result as string;
      setAttachments(pid, [...attachments, {
        id: Date.now().toString(),
        name: file.name,
        type: file.type,
        size: file.size,
        data: base64,
        uploaded_at: new Date().toISOString(),
      }]);
    };
    reader.readAsDataURL(file);
    if (fileRef.current) fileRef.current.value = '';
  };

  const deleteAttachment = (id: string) => {
    setAttachments(pid, attachments.filter(a => a.id !== id));
  };

  const totalCost = expenses.reduce((s, e) => s + e.cost, 0);
  const totalSell = expenses.reduce((s, e) => s + e.sell, 0);

  if (!activeProject) {
    return (
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Procurement</h1>
        <div className="card p-16 flex items-center justify-center">
          <p className="text-muted-foreground text-sm">Select a project first.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Procurement, Expenses & Audit Trail</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{activeProject.name} · Non-resource costs & documents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expenses Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-2">
              <Plus className="w-4 h-4 text-brand-400" /> Non-Resource Expenses
            </h3>
            <button onClick={addExpense} className="btn-primary btn-sm">Add Item</button>
          </div>

          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="table">
                <thead>
                  <tr>
                    <th>Description</th>
                    <th>Category</th>
                    <th className="text-right">Cost (MYR)</th>
                    <th className="text-right">Sell (MYR)</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(exp => (
                    <tr key={exp.id}>
                      <td>
                        <input
                          className="bg-transparent outline-none text-foreground w-full placeholder-gray-600 text-sm"
                          value={exp.description}
                          onChange={e => updateExpense(exp.id!, { description: e.target.value })}
                        />
                      </td>
                      <td>
                        <select
                          className="bg-secondary border border-input rounded px-2 py-0.5 text-xs text-foreground/80 outline-none"
                          value={exp.category}
                          onChange={e => updateExpense(exp.id!, { category: e.target.value as ExpenseItem['category'] })}
                        >
                          {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </td>
                      <td className="text-right">
                        <input
                          type="number"
                          className="bg-transparent text-right outline-none text-foreground/80 tabular-nums w-28 text-sm"
                          value={exp.cost}
                          onChange={e => updateExpense(exp.id!, { cost: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="text-right">
                        <input
                          type="number"
                          className="bg-transparent text-right outline-none text-brand-400 font-semibold tabular-nums w-28 text-sm"
                          value={exp.sell}
                          onChange={e => updateExpense(exp.id!, { sell: parseFloat(e.target.value) || 0 })}
                        />
                      </td>
                      <td className="text-center">
                        <button onClick={() => removeExpense(exp.id!)} className="text-gray-600 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-10 text-center text-gray-600 italic text-sm">
                        No expense items added yet.
                      </td>
                    </tr>
                  )}
                </tbody>
                {expenses.length > 0 && (
                  <tfoot>
                    <tr className="bg-secondary font-bold border-t border-input">
                      <td colSpan={2} className="px-4 py-2.5 text-xs text-muted-foreground/80 uppercase tracking-widest">Totals</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-foreground/80">{formatCurrency(totalCost)}</td>
                      <td className="px-4 py-2.5 text-right tabular-nums text-brand-300 font-black">{formatCurrency(totalSell)}</td>
                      <td></td>
                    </tr>
                    <tr className="bg-emerald-900/20">
                      <td colSpan={4} className="px-4 py-2 text-right text-xs text-emerald-400 font-bold">
                        Margin: {formatPercent(totalSell > 0 ? (totalSell - totalCost) / totalSell : 0)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>

        {/* Attachments */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-foreground/80 flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400" /> Audit Trail & Estimations
            </h3>
            <label className="btn-primary btn-sm cursor-pointer">
              <Upload className="w-3.5 h-3.5" /> Upload Doc
              <input ref={fileRef} type="file" className="hidden" onChange={handleFileUpload} />
            </label>
          </div>

          <div className="card p-4 space-y-3 min-h-[200px]">
            {attachments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 gap-3 border-2 border-dashed border-border rounded-xl">
                <FileText className="w-8 h-8 text-gray-600" />
                <p className="text-sm text-muted-foreground/80 text-center">No documents attached.<br/>Upload cloud estimates or quotations.</p>
              </div>
            ) : (
              attachments.map(att => (
                <div key={att.id} className="flex items-center justify-between bg-secondary hover:bg-surface-650 rounded-xl p-3 border border-border transition-all group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="bg-brand-500/20 p-2 rounded-lg text-brand-400 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="overflow-hidden">
                      <p className="text-sm font-semibold text-foreground truncate max-w-[180px]">{att.name}</p>
                      <p className="text-[10px] text-muted-foreground/80">
                        {(att.size / 1024).toFixed(1)} KB · {new Date(att.uploaded_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <a href={att.data} download={att.name} className="p-1.5 text-muted-foreground/80 hover:text-foreground transition-colors rounded">
                      <Download className="w-3.5 h-3.5" />
                    </a>
                    <button onClick={() => deleteAttachment(att.id!)} className="p-1.5 text-muted-foreground/80 hover:text-red-400 transition-colors rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
