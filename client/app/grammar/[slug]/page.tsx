import { grammarLessons } from "@/lib/grammar";
import GrammarLessonView from "@/components/GrammarLessonView";

// Pre-render the known seed slugs; allow client-rendered pages for any lessons
// added to the local library later.
export function generateStaticParams() {
  return grammarLessons.map((l) => ({ slug: l.slug }));
}
export const dynamicParams = true;

export default function GrammarLessonPage({
  params,
}: {
  params: { slug: string };
}) {
  // Lesson data lives in localStorage (client) — pass the slug down.
  return <GrammarLessonView slug={params.slug} />;
}
