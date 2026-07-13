import { OG_SIZE, renderOgImage } from "@/lib/ogImage";

export const alt = "SongMatch — where lyrics find their voice.";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return renderOgImage();
}
