import '@shopify/ui-extensions/preact';
import {render} from "preact";
import {limitText} from '../../shared/text';
import {trackThankYouClick} from '../../shared/analytics';

export default () => {
  render(<Extension />, document.body);
};

function Extension() {
  const s = shopify.settings.current;

  if (!s.video_url || !s.video_thumbnail) return null;

  const heading = limitText(s.video_heading || 'Watch this 👇', 60);

  const handleVideoClick = () => {
    trackThankYouClick(
      'video_click',
      {
        ctaText: heading,
        ctaLink: s.video_url,
        itemTitle: heading || 'Video',
        itemUrl: s.video_url,
      },
    );
  };

  return (
    <s-box padding="base" border="base" borderRadius="base">
      <s-stack gap="base">
        <s-stack gap="small">
          <s-text type="strong">{heading}</s-text>
          <s-text>
            Watch the video on a full-width image that scales cleanly on mobile.
          </s-text>
        </s-stack>

        <s-link
          href={s.video_url}
          target="_blank"
          onClick={handleVideoClick}
        >
          <s-image
            src={s.video_thumbnail}
            alt={heading}
            aspectRatio="16/9"
          />
        </s-link>
      </s-stack>
    </s-box>
  );
}
