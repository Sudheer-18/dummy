export default function QuestionCard({ question }: { question: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h3 className="text-xl md:text-2xl font-semibold">{question}</h3>
    </div>
  )
}
