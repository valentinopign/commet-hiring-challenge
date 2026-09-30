export type Theme = "dark" | "light";

export const THEME_STORAGE_KEY = "theme";

/**
 * Runs inline in <head>, before the first paint, so a stored light theme never flashes dark.
 * Dark is the default and needs no attribute. Storage can throw (private mode, blocked site
 * data); the page then simply stays dark.
 */
export const themeInitScript = `try{if(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})==="light")document.documentElement.dataset.theme="light"}catch(e){}`;
