import { useParams } from "react-router-dom";
import { NoteIcon24 } from "../components/icons";
import { NoteCard } from "../components/note-card";

export function NotePage() {
  const { id } = useParams();

  return (
    <div className="max-w-lg mx-auto flex flex-col gap-4 p-4 ">
      <div className="flex gap-2">
        <NoteIcon24 />
        <h1 className="text-lg font-semibold leading-[24px]">Note</h1>
      </div>
      <NoteCard id={Number(id)} />
    </div>
  );
}
