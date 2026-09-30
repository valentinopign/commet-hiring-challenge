type PageHeadingProps = {
  title: string;
  description: string;
};

export function PageHeading({ title, description }: PageHeadingProps) {
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-0.5 max-w-prose text-ink-muted">{description}</p>
    </div>
  );
}
