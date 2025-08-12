import DomainCard from './components/DominCard'

export default function HomePage(){
  const domains = [
    {title: 'Web Development', subtitle: 'Frontend, Backend, Full-stack'},
    {title: 'Data Science', subtitle: 'ML, Analytics, Statistics'},
    {title: 'AI & Machine Learning', subtitle: 'Neural nets, NLP, CV'},
    {title: 'Product Management', subtitle: 'Roadmaps, Strategy, UX'},
    {title: 'UI/UX Design', subtitle: 'Design systems, Research'},
    {title: 'Cybersecurity', subtitle: 'Risk, Protocols, Compliance'}
  ]

  return (
    <div className="max-w-6xl mx-auto">
      <section className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-center mb-6">Select Your Interview Domain</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {domains.map((d) => <DomainCard key={d.title} title={d.title} subtitle={d.subtitle} href={`/interview?domain=${encodeURIComponent(d.title)}`} />)}
        </div>
      </section>

      <div className="flex justify-center mt-10">
        <a href="/interview" className="px-6 py-3 bg-gradient-to-r from-indigo-400 to-violet-400 text-white rounded-full shadow">Start Interview →</a>
      </div>
    </div>
  )
}
