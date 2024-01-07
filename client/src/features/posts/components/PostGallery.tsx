import { useMemo, useState } from "react";
import { PostMedia } from "../slices/postsApiSlice";
import { Gallery } from "react-grid-gallery";
import Lightbox from "yet-another-react-lightbox";
import "yet-another-react-lightbox/styles.css";
import { optimizeImageUrl } from "@/lib/utils";

interface Props {
  media: PostMedia[];
}

const PostGallery = ({ media }: Props) => {
  const [index, setIndex] = useState(-1);

  const handleClick = (index: number) => setIndex(index);

  const { images, slides } = useMemo(() => {
    const images = [];
    const slides = [];

    for (const m of media) {
      const ratio = m.height / m.width;
      images.push({
        src: optimizeImageUrl(m.url, m.subtype, { quality: "lighter" }),
        width: m.width,
        height: m.height,
      });
      slides.push({
        src: m.url,
        width: m.width,
        height: m.height,
        srcSet: [
          {
            src: optimizeImageUrl(m.url, m.subtype, {
              quality: "normal",
              resize: "320x",
            }),
            width: 320,
            height: 320 * ratio,
          },
          {
            src: optimizeImageUrl(m.url, m.subtype, {
              quality: "normal",
              resize: "640x",
            }),
            width: 640,
            height: 640 * ratio,
          },
          {
            src: optimizeImageUrl(m.url, m.subtype, {
              quality: "normal",
              resize: "1200x",
            }),
            width: 1200,
            height: 1200 * ratio,
          },
          {
            src: optimizeImageUrl(m.url, m.subtype, {
              quality: "normal",
              resize: "2048x",
            }),
            width: 2048,
            height: 2048 * ratio,
          },
          {
            src: optimizeImageUrl(m.url, m.subtype, {
              quality: "normal",
              resize: "3840x",
            }),
            width: 3840,
            height: 3840 * ratio,
          },
        ],
      });
    }

    return { images, slides };
  }, [media]);

  return (
    <div className="mt-2">
      <Gallery images={images} onClick={handleClick} enableImageSelection={false} />
      <Lightbox
        slides={slides}
        open={index >= 0}
        index={index}
        close={() => setIndex(-1)}
      />
    </div>
  );
};

export { PostGallery };
