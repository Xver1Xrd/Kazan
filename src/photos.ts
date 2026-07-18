// Real trip photos: drop image files into src/photos/ and they appear in the
// gallery automatically. The file name (without extension) becomes the caption:
// "закат-над-казанкой.jpg" -> "закат над казанкой".
const modules = import.meta.glob('./photos/*.{jpg,jpeg,png,webp,JPG,JPEG,PNG,WEBP}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;

export type Photo = { url: string; caption: string };

export const PHOTOS: Photo[] = Object.keys(modules)
  .sort()
  .map((path) => ({
    url: modules[path],
    caption: path
      .split('/')
      .pop()!
      .replace(/\.[^.]+$/, '')
      .replace(/[-_]+/g, ' '),
  }));
