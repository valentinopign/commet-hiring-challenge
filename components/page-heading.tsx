type PageHeadingProps = { title: string };

/** The visible title lives in the top bar; the <h1> stays here for headings and the skip link. */
export function PageHeading({ title }: PageHeadingProps) {
  return <h1 className="sr-only">{title}</h1>;
}
