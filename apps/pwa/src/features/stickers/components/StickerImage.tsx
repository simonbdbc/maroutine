import { useEffect, useState } from "react";
import { Image, Platform } from "react-native";
import { getStickerSource, getStickerWebUri } from "@features/stickers/registry";

interface StickerImageProps {
  stickerKey: string;
  size?: number;
}

/** Affiche toujours une image sticker (asset réel ou fallback star-sticker). */
export function StickerImage({ stickerKey, size = 40 }: StickerImageProps) {
  const [webLoadFailed, setWebLoadFailed] = useState(false);
  const localSource = getStickerSource(stickerKey);
  const webUri = getStickerWebUri(stickerKey);
  const useWebUri = Platform.OS === "web" && !!webUri && !webLoadFailed;
  const source = useWebUri ? { uri: webUri! } : localSource;

  useEffect(() => {
    setWebLoadFailed(false);
  }, [stickerKey]);

  if (!source) {
    return null;
  }

  return (
    <Image
      source={source}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      resizeMode="cover"
      onError={() => {
        if (useWebUri) {
          setWebLoadFailed(true);
        }
      }}
    />
  );
}
