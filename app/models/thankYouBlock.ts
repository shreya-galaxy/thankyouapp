export type ThankYouBlockType =
  | "faq"
  | "image"
  | "video"
  | "media"
  | "upsell"
  | "referral"
  | "loyalty";

export type ThankYouBlockConfig = {
  heading?: string;
  items?: Array<{question: string; answer: string}>;
  mediaType?: "image" | "video";
  imageUrl?: string;
  imageAlt?: string;
  imageLink?: string;
  videoUrl?: string;
  videoThumbnail?: string;
  upsellHeading?: string;
  emptyMessage?: string;
  title?: string;
  description?: string;
  buttonText?: string;
  buttonUrl?: string;
  shareLabel?: string;
  shareText?: string;
  referralCode?: string;
  referralLink?: string;
  friendReward?: string;
  advocateReward?: string;
  pointsText?: string;
  validUntil?: string;
};

export const blockTemplates = {
  faq: {
    type: "faq",
    title: "FAQ Accordion",
    description: "Surface common questions post-purchase.",
    defaultName: "FAQ Accordion",
    defaultConfig: {
      heading: "Frequently asked questions",
      items: [],
    },
  },
  image: {
    type: "image",
    title: "Image Block",
    description: "Show a static image on the thank-you page.",
    defaultName: "Image Block",
    defaultConfig: {
      heading: "",
      imageUrl: "",
      imageAlt: "",
      imageLink: "",
    },
  },
  video: {
    type: "video",
    title: "Video Block",
    description: "Show a video title, thumbnail, and link after purchase.",
    defaultName: "Video Block",
    defaultConfig: {
      heading: "Watch this",
      videoUrl: "",
      videoThumbnail: "",
    },
  },
  media: {
    type: "media",
    title: "Image / Video",
    description: "Legacy combined image or video block.",
    defaultName: "Image / Video",
    defaultConfig: {},
    deprecated: true,
  },
  upsell: {
    type: "upsell",
    title: "Upsell Products",
    description: "Recommend products from purchased product metafields.",
    defaultName: "Upsell Products",
    defaultConfig: {},
  },
  referral: {
    type: "referral",
    title: "Referral Offer",
    description: "Invite customers to share your store with friends.",
    defaultName: "Referral Offer",
    defaultConfig: {
      title: "Refer friends. Get rewards.",
      description:
        "Give your friends {friend_reward} off all products. Get {advocate_reward} off all products when they purchase with your discount code {referral_code}.",
      shareLabel: "Share now:",
      shareText: "Share",
      referralCode: "THANKYOU15",
      referralLink: "",
      friendReward: "15%",
      advocateReward: "$10",
    },
  },
  loyalty: {
    type: "loyalty",
    title: "Loyalty Offer",
    description: "Promote points, rewards, or account signups after purchase.",
    defaultName: "Loyalty Offer",
    defaultConfig: {
      title: "Join our loyalty program",
      description:
        "Earn 2x points on future purchases and unlock member-only rewards.",
      buttonText: "Join now",
      buttonUrl: "",
      pointsText: "2x points",
      validUntil: "",
    },
  },
} as const;

export function isBlockType(value: unknown): value is ThankYouBlockType {
  return (
    value === "faq" ||
    value === "image" ||
    value === "video" ||
    value === "media" ||
    value === "upsell" ||
    value === "referral" ||
    value === "loyalty"
  );
}

export function parseBlockConfig(value?: string | null): ThankYouBlockConfig {
  if (!value) return {};

  try {
    return JSON.parse(value) as ThankYouBlockConfig;
  } catch {
    return {};
  }
}

export function configFromForm(
  type: ThankYouBlockType,
  formData: FormData,
): ThankYouBlockConfig {
  if (type === "faq") {
    return {
      heading: field(formData, "heading"),
      items: faqItemsFromForm(formData),
    };
  }

  if (type === "image" || type === "video" || type === "media") {
    const mediaType =
      type === "video" || field(formData, "mediaType") === "video"
        ? "video"
        : "image";

    return {
      heading: field(formData, "heading"),
      mediaType,
      imageUrl: field(formData, "imageUrl"),
      imageAlt: field(formData, "imageAlt"),
      imageLink: field(formData, "imageLink"),
      videoUrl: field(formData, "videoUrl"),
      videoThumbnail: field(formData, "videoThumbnail"),
    };
  }

  if (type === "referral") {
    return {
      title: field(formData, "title"),
      description: field(formData, "description"),
      shareLabel: field(formData, "shareLabel"),
      shareText: field(formData, "shareText"),
      referralCode: field(formData, "referralCode"),
      referralLink: field(formData, "referralLink"),
      friendReward: field(formData, "friendReward"),
      advocateReward: field(formData, "advocateReward"),
    };
  }

  if (type === "loyalty") {
    return {
      title: field(formData, "title"),
      description: field(formData, "description"),
      buttonText: field(formData, "buttonText"),
      buttonUrl: field(formData, "buttonUrl"),
      pointsText: field(formData, "pointsText"),
      validUntil: field(formData, "validUntil"),
    };
  }

  return {
    upsellHeading: field(formData, "upsellHeading"),
    emptyMessage: field(formData, "emptyMessage"),
  };
}

export function field(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value.trim() : "";
}

function faqItemsFromForm(formData: FormData) {
  const indexedItems = Array.from(formData.entries()).reduce<
    Array<{question: string; answer: string}>
  >((items, [name, value]) => {
    if (typeof value !== "string") return items;

    const match = name.match(/^(question|answer)_(\d+)$/);
    if (!match) return items;

    const index = Number(match[2]);
    items[index] = items[index] || {question: "", answer: ""};
    items[index][match[1] as "question" | "answer"] = value.trim();

    return items;
  }, []);

  const visibleItems = indexedItems.filter(
    (item) => item?.question || item?.answer,
  );

  if (visibleItems.length) return visibleItems;

  const faqData = formData.get("faq_data");

  if (!faqData) return [];

  try {
    const parsed = JSON.parse(String(faqData));

    return Array.isArray(parsed)
      ? parsed.map((item: unknown) => {
          const faq =
            item && typeof item === "object"
              ? (item as {question?: unknown; answer?: unknown})
              : {};

          return {
            question:
              typeof faq.question === "string" ? faq.question.trim() : "",
            answer: typeof faq.answer === "string" ? faq.answer.trim() : "",
          };
        })
      : [];
  } catch (error) {
    console.error("Failed to parse FAQ data:", error);
    return [];
  }
}
