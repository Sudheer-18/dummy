export default function ProgressBar({current, total}:{current:number, total:number}) {
  const percent = Math.round((current / Math.max(1, total)) * 100)
  return (
    <div>
      <div className="text-sm text-slate-600 mb-2">Question {current} of {total}</div>
      <div className="w-full bg-slate-200 h-2 rounded">
        <div className="h-2 rounded bg-gradient-to-r from-indigo-400 to-violet-400" style={{ width: `${percent}%`}} />
      </div>
    </div>
  )
}
