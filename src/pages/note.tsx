import { useParams } from "react-router-dom";
import { NoteCard } from "../components/note-card";

export function NotePage() {
  const { id } = useParams();

  return (
    <div className="flex flex-col gap-4 p-4">
      <h1>Note</h1>
      <NoteCard id={Number(id)} />
    </div>
  );
}
