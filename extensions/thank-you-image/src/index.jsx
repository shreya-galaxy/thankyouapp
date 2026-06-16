import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {useEffect, useState} from "preact/hooks";
import {limitText, trimText} from '../../shared/text';
import {trackThankYouClick} from '../../shared/analytics';
import {fetchActiveBlock} from '../../shared/blocks';

export default () => {
  render(<Extension />, document.body);
};

function Extension() {
  const [blocks, setBlocks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchBlock('image'),
      // fetchBlock('video'),
      fetchBlock('media'),
    ])
      .then((results) => {
        setBlocks(
          results
            .filter(Boolean)
            .map((block) => ({
              id: block.id,
              type: block.type,
              config: block.config || {},
            })),
        );
      })
      .catch((error) => {
        console.error(error);
        setBlocks([]);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading || !blocks.length) return null;

  return (
    <s-stack gap="base">
      {blocks.map((block) => (
        <MediaBlock key={block.id} block={block} />
      ))}
    </s-stack>
  );
}

function fetchBlock(type) {
  return fetchActiveBlock(type).catch((error) => {
    console.error(`Could not load ${type} thank-you block`, error);

    return null;
  });
}

function MediaBlock({block}) {
  const config = block.config || {};
  const heading = limitText(
    trimText(config.heading) || (block.type === 'video' ? 'Watch this' : ''),
    60,
  );
  const videoUrl = trimText(config.videoUrl);
  const videoThumbnail = trimText(config.videoThumbnail);
  const imageUrl = trimText(config.imageUrl);
  const imageAlt = trimText(config.imageAlt);
  const imageLink = trimText(config.imageLink);
  const showVideo = block.type === 'video' || config.mediaType === 'video';

  if (showVideo && (!videoUrl || !videoThumbnail)) return null;
  if (!showVideo && !imageUrl) return null;

  const handleClick = () => {
    const eventType = showVideo ? 'video_click' : 'image_click';
    const destination = showVideo ? videoUrl : imageLink;

    if (!destination) return;

    trackThankYouClick(
      eventType,
      {
        ctaText: heading,
        ctaLink: destination,
        itemTitle: heading || (showVideo ? 'Video' : 'Image'),
        itemUrl: destination,
      },
    );
  };

  const mediaImage = (
    <s-image
      src={showVideo ? videoThumbnail : imageUrl}
      alt={showVideo ? heading : imageAlt || heading || 'Image'}
      aspectRatio="16/9"
    />
  );

  const media = showVideo || imageLink ? (
    <s-link
      href={showVideo ? videoUrl : imageLink}
      target="_blank"
      onClick={handleClick}
    >
      {mediaImage}
    </s-link>
  ) : (
    mediaImage
  );

  return (
    <s-box padding="base" border="base" borderRadius="base">
      <s-stack gap="base">
        {heading && <s-text type="strong">{heading}</s-text>}

        {media}
      </s-stack>
    </s-box>
  );
}
