import { Markdown } from "./markdown"

export function NotePreview({ children }: { children: string }) {
  return (
    <div className="aspect-[5/3] w-full overflow-hidden p-3 [contain:layout_paint] [mask-image:linear-gradient(to_bottom,black_0%,black_75%,transparent_100%)] [&_*::-webkit-scrollbar]:hidden">
      <div {...{ inert: "" }} className="w-[125%] origin-top-left scale-[80%]">
        <Markdown hideFrontmatter>{children}</Markdown>
      </div>
    </div>
  )
}
