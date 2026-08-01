import { StoryForm } from "../StoryForm";

export default async function YangiErtakPage({
  searchParams,
}: {
  searchParams: Promise<{ xato?: string }>;
}) {
  const { xato } = await searchParams;
  return (
    <>
      <h1 className="text-3xl font-extrabold">Yangi ertak</h1>
      <StoryForm story={{}} xato={xato} />
    </>
  );
}
