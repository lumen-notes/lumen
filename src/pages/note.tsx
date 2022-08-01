import { useParams } from "react-router-dom";

export function NotePage() {
  const { id } = useParams();

  return <div>Note {id}</div>;
}
