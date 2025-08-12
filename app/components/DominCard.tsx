import Link from 'next/link'
export default function DomainCard({title, subtitle, href}:{title:string, subtitle?:string, href?:string}) {
  return (
    <Link href={href || '/interview'}>
      <div className="cursor-pointer p-6 rounded-xl bg-white shadow-sm border border-slate-100 hover:shadow-md transition">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-xl">💡</div>
          <div>
            <h3 className="font-semibold text-lg">{title}</h3>
            <p className="text-slate-500 text-sm mt-1">{subtitle}</p>
          </div>
        </div>
      </div>
    </Link>
  )
}
