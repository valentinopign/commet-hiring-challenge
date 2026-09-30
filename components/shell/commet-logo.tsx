/**
 * The Commet mark is used as a mask and painted with the ink token, so a single SVG shows
 * correctly in both themes: light on the dark canvas, dark on the light one.
 */
export function CommetLogo() {
  return (
    <span
      role="img"
      aria-label="Commet"
      className="block size-6 shrink-0 bg-ink [mask:url(/commet-mark.svg)_center/contain_no-repeat]"
    />
  );
}
