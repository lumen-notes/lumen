import { Markdown } from "./markdown"

export function NotePreview({ children }: { children: string }) {
  return (<div className="aspect-[5/3] w-full overflow-hidden p-3 [mask-image:linear-gradient(to_bottom,black_0%,black_80%,transparent_100%)] [contain:layout_paint] coarse:p-4 [&_*::-webkit-scrollbar]:hidden">
      <div {...{ inert: "" }} className="[zoom:80%]">
        <Markdown hideFrontmatter>{children}</Markdown>
      </div>
    </div>
  )
}
