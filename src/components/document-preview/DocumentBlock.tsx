import type { DocumentBlock as DocumentBlockType } from "@/features/impulsa/request-types";

type DocumentBlockProps = {
  block: DocumentBlockType;
};

export default function DocumentBlock({ block }: DocumentBlockProps) {
  if (block.type === "category-title") {
    return (
      <h3 className="mb-2 mt-4 text-[12px] font-bold uppercase tracking-wide text-slate-900">
        {block.text}
      </h3>
    );
  }

  if (block.type === "item") {
    return (
      <li className="mb-2 pl-1 text-[11px] leading-[1.55] text-slate-900">
        <span>{block.text}</span>

        {block.children.length > 0 && (
          <ul className="mt-1 list-[circle] pl-5">
            {block.children.map((child, index) => (
              <li
                key={`${block.id}-child-${index}`}
                className="mb-1 text-[10.5px] leading-[1.5] text-slate-800"
              >
                {child}
              </li>
            ))}
          </ul>
        )}
      </li>
    );
  }

  return (
    <p className="mb-3 text-justify text-[11px] leading-[1.55] text-slate-900">
      {block.text}
    </p>
  );
}