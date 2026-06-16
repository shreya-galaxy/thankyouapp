import type {ThankYouBlockConfig, ThankYouBlockType} from "../models/thankYouBlock";
import {useAppBridge} from "@shopify/app-bridge-react";
import {blockTemplates} from "../models/thankYouBlock";
import {
  useState,
  useRef,
  useEffect,
  type CSSProperties,
  type FormEvent,
} from "react";
import {Form, useNavigate} from "react-router";

type Props = {
  blockId?: string;
  type: ThankYouBlockType;
  name: string;
  status: string;
  config: ThankYouBlockConfig;
  mode: "create" | "edit";
};

type SaveResult = {
  success?: boolean;
  message?: string;
  redirectTo?: string;
};

const fieldStyle: CSSProperties = {
  border: "1px solid #c9cccf",
  borderRadius: "8px",
  font: "inherit",
  padding: "10px 12px",
  width: "100%",
  maxWidth: "100%",
  boxSizing: "border-box",
  display: "block",
};

const labelStyle: CSSProperties = {
  display: "block",
  fontWeight: 650,
  marginBlockEnd: "6px",
};

const gridStyle: CSSProperties = {
  display: "grid",
  gap: "16px",
  gridTemplateColumns: "minmax(0, 2fr) minmax(240px, 1fr)",
  alignItems: "start",
  width: "100%",
};

const cardStyle: CSSProperties = {
  background: "#fff",
  border: "1px solid #d7dce0",
  borderRadius: "10px",
  padding: "16px",
  overflow: "hidden",
  width: "100%",
  boxSizing: "border-box",
};

const submitStyle: CSSProperties = {
  background: "#303030",
  border: 0,
  borderRadius: "8px",
  color: "#fff",
  cursor: "pointer",
  font: "inherit",
  fontWeight: 650,
  padding: "10px 14px",
};

export function ThankYouBlockEditor({
  blockId,
  type,
  name,
  status,
  config,
  mode,
}: Props) {
  const shopify = useAppBridge();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const template = blockTemplates[type];
  const faqItems = config.items?.length
    ? config.items
    : defaultFaqItems(template.defaultConfig);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    setIsSaving(true);
    setSaveError("");

    try {
      const token = await shopify.idToken();
      const response = await fetch(window.location.pathname + window.location.search, {
        method: "POST",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: new FormData(form),
      });
      const result = (await response.json().catch(() => null)) as SaveResult | null;

      // Surface explicit authentication errors to the user without throwing generic message
      if (response.status === 401) {
        setSaveError(result?.message || "Not authenticated. Please log in.");
        return;
      }

      // if (!response.ok || !result?.success) {
      //   throw new Error(result?.message || JSON.stringify(response) || "Could not save block1.");
      // }

      navigate(result?.redirectTo || "/app/blocks");
    } catch (error) {
      console.error("SAVE REQUEST ERROR:", error);
      setSaveError(
        error instanceof Error ? error.message : "Could not save block2.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
      <s-page
          heading={
            mode === "create"
              ? template.title
              : name.length > 50
              ? `${name.slice(0, 50)}...`
              : name
          }
        >
      <s-button slot="breadcrumb-actions" href="/app/blocks">
        Blocks
      </s-button>

      <Form method="post" onSubmit={handleSubmit}>
        <input type="hidden" name="type" value={type} />

        <div style={gridStyle}>
          <s-stack gap="base">
            <section style={cardStyle}>
              <s-stack gap="small">
                <s-heading>Block name</s-heading>
                <input
                  aria-label="Block name"
                  defaultValue={name}
                  maxLength={69}
                  name="name"
                  required
                  style={fieldStyle}
                />
                <s-text color="subdued">
                  Internal only. Not shown to customers.
                </s-text>
              </s-stack>
            </section>

            <section style={cardStyle}>
              <s-stack gap="base">
                <s-heading>Content</s-heading>
                {type === "faq" ? (
                  <FaqFields heading={config.heading} items={faqItems} />
                ) : type === "image" || type === "video" || type === "media" ? (
                  <MediaFields config={config} type={type} />
                ) : type === "referral" ? (
                  <ReferralFields config={config} />
                ) : type === "loyalty" ? (
                  <LoyaltyFields config={config} />
                ) : (
                  <UpsellFields config={config} />
                )}
              </s-stack>
            </section>

            {/* <section style={cardStyle}>
              <s-stack gap="small">
                <s-heading>Display rules</s-heading>
                <s-box padding="base" borderWidth="base" borderRadius="base">
                  <s-text>Block will be shown to all customers.</s-text>
                </s-box>
              </s-stack>
            </section>*/}

            <section style={{ display: "none" }}>
              <s-stack gap="small">
                <s-heading>Block ID</s-heading>
                <input
                  aria-label="Block ID"
                  disabled
                  style={fieldStyle}
                  value={blockId || "Create after save"}
                />
                <s-text color="subdued">
                  Use the matching app extension block in Shopify checkout
                  customization.
                </s-text>
              </s-stack>
            </section> 
          </s-stack>

          <s-stack gap="base">
            {/* <section style={cardStyle}>
              <s-stack gap="small">
                <s-heading>Preview</s-heading>
                <BlockPreview type={type} config={config} />
              </s-stack>
            </section> */}

            <section style={cardStyle}>
              <s-stack gap="small">
                <s-heading>Status</s-heading>
                <select
                  aria-label="Status"
                  defaultValue={status}
                  name="status"
                  style={fieldStyle}
                >
                  <option value="draft">Draft</option>
                  <option value="active">Active</option>
                </select>
              </s-stack>
            </section>

            {/* <section style={cardStyle}>
              <s-stack gap="small">
                <s-heading>Publishing</s-heading>
                <s-text>Locations</s-text>
                <s-unordered-list>
                  <s-list-item>Thank you</s-list-item>
                  <s-list-item>Order status</s-list-item>
                </s-unordered-list>
              </s-stack>
            </section> */}

            {saveError && (
              <s-banner tone="critical">
                <s-text>{saveError}</s-text>
              </s-banner>
            )}

            <button disabled={isSaving} type="submit" style={submitStyle}>
              {isSaving ? "Saving..." : "Save"}
            </button>
          </s-stack>
        </div>
      </Form>
    </s-page>
  );
}

// function FaqFields({items}: {items: Array<{question: string; answer: string}>}) {
//   return (
//     <s-stack gap="base">
//       <div>
//         <label style={labelStyle} htmlFor="heading">
//           Section header
//         </label>
//         <input
//           defaultValue="Frequently asked questions"
//           id="heading"
//           maxLength={80}
//           name="heading"
//           style={fieldStyle}
//         />
//       </div>

//       {Array.from({length: 5}, (_, index) => {
//         const item = items[index] || {question: "", answer: ""};
//         const position = index + 1;

//         return (
//           <s-box
//             key={position}
//             padding="base"
//             borderWidth="base"
//             borderRadius="base"
//           >
//             <s-stack gap="small">
//               <s-heading>Accordion item {position}</s-heading>
//               <input
//                 aria-label={`Question ${position}`}
//                 defaultValue={item.question}
//                 maxLength={80}
//                 name={`question_${position}`}
//                 placeholder="Question"
//                 style={fieldStyle}
//               />
//               <textarea
//                 aria-label={`Answer ${position}`}
//                 defaultValue={item.answer}
//                 maxLength={240}
//                 name={`answer_${position}`}
//                 placeholder="Answer"
//                 rows={3}
//                 style={fieldStyle}
//               />
//             </s-stack>
//           </s-box>
//         );
//       })}
//     </s-stack>
//   );
// }



function FaqFields({
  heading,
  items,
}: {
  heading?: string;
  items: Array<{question: string; answer: string}>;
}) {
  const [faqs, setFaqs] = useState(
    items.length ? items : [{question: "", answer: ""}],
  );
  const hiddenInputRef = useRef<HTMLInputElement>(null);

  // Update hidden input whenever faqs changes
  useEffect(() => {
    if (hiddenInputRef.current) {
      hiddenInputRef.current.value = JSON.stringify(faqs);
    }
  }, [faqs]);

  const addFaq = () => {
    setFaqs([...faqs, {question: "", answer: ""}]);
  };

  const removeFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const updateFaq = (
    index: number,
    field: "question" | "answer",
    value: string,
  ) => {
    const updated = [...faqs];
    updated[index] = {
      ...updated[index],
      [field]: value,
    };
    setFaqs(updated);
  };
 

  return (
    <s-stack gap="base">
      <div>
        <label style={labelStyle} htmlFor="heading">
          Section header
        </label>
        <input
          defaultValue={heading || "Frequently asked questions"}
          id="heading"
          maxLength={80}
          name="heading"
          style={fieldStyle}
        />
      </div>

      {faqs.map((item, index) => (
        <s-box
          key={index}
          padding="base"
          borderWidth="base"
          borderRadius="base"
        >
          <s-stack gap="small">
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              {/* <s-heading>FAQ {index + 1}</s-heading> */}
              <div
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  minWidth: 0,
                }}
              >
                <s-heading>FAQ {index + 1}</s-heading>
              </div>

              {faqs.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeFaq(index)}
                  style={{
                    border: "none",
                    background: "none",
                    color: "#d82c0d",
                    cursor: "pointer",
                  }}
                >
                  Remove FAQ
                </button>
              )}
            </div>

            <label style={labelStyle} htmlFor={`question_${index}`}>
              Question
            </label>
            <input
              id={`question_${index}`}
              value={item.question}
              onInput={(e) =>
                updateFaq(
                  index,
                  "question",
                  (e.target as HTMLInputElement).value,
                )
              }
              name={`question_${index}`}
              placeholder="Question"
              style={fieldStyle}
            />

            <label style={labelStyle} htmlFor={`answer_${index}`}>
              Answer
            </label>
            <textarea
              id={`answer_${index}`}
              value={item.answer}
              onInput={(e) =>
                updateFaq(
                  index,
                  "answer",
                  (e.target as HTMLTextAreaElement).value,
                )
              }
              name={`answer_${index}`}
              placeholder="Answer"
              rows={4}
              style={fieldStyle}
            />

            
            
          </s-stack>
        </s-box>
      ))}

      {/* Hidden field for form submission */}
      <input
        ref={hiddenInputRef}
        type="hidden"
        name="faq_data"
        readOnly
        value={JSON.stringify(faqs)}
      />
      

      <div style={{display: "flex", justifyContent: "flex-end"}}>
        <button
          type="button"
          onClick={addFaq}
          style={{
            padding: "8px 16px",
            cursor: "pointer",
          }}
        >
          + Add FAQ
        </button>
      </div>
    </s-stack>
  );
}

function defaultFaqItems(config: ThankYouBlockConfig) {
  return Array.isArray(config.items) ? config.items : [];
}

function MediaFields({
  config,
  type,
}: {
  config: ThankYouBlockConfig;
  type: ThankYouBlockType;
}) {
  const fixedMediaType =
    type === "image" || type === "video" ? type : undefined;
  const initialMediaType =
    fixedMediaType || config.mediaType || (config.videoUrl ? "video" : "image");
  const [mediaType, setMediaType] = useState(initialMediaType);
  const isVideo = fixedMediaType === "video" || mediaType === "video";

  return (
    <s-stack gap="base">
      <div>
        <label style={labelStyle} htmlFor="heading">
          {isVideo ? "Video title" : "Section header"}
        </label>
        <input
          defaultValue={config.heading || (isVideo ? "Watch this" : "")}
          id="heading"
          maxLength={60}
          name="heading"
          style={fieldStyle}
        />
      </div>

      {fixedMediaType ? (
        <input type="hidden" name="mediaType" value={fixedMediaType} />
      ) : (
        <div>
          <label style={labelStyle} htmlFor="mediaType">
            Media type
          </label>
          <select
            value={mediaType}
            id="mediaType"
            name="mediaType"
            onChange={(event) =>
              setMediaType(
                (event.target as HTMLSelectElement).value as "image" | "video",
              )
            }
            style={fieldStyle}
          >
            <option value="image">Image</option>
            <option value="video">Video</option>
          </select>
        </div>
      )}

      {isVideo ? (
        <>
          <input
            aria-label="Video URL"
            defaultValue={config.videoUrl || ""}
            name="videoUrl"
            placeholder="Video URL"
            style={fieldStyle}
          />
          <input
            aria-label="Thumbnail image URL"
            defaultValue={config.videoThumbnail || ""}
            name="videoThumbnail"
            placeholder="Thumbnail image URL"
            style={fieldStyle}
          />
          <text>Upload your image for free using Shopify's Files page, within the Content tab.</text>
        </>
      ) : (
        <>
          <text>Upload your image for free using Shopify's Files page, within the Content tab.</text>
          <input
            aria-label="Image URL"
            defaultValue={config.imageUrl || ""}
            name="imageUrl"
            placeholder="Image URL"
            style={fieldStyle}
          />
          <input
            aria-label="Image alt text"
            defaultValue={config.imageAlt || ""}
            name="imageAlt"
            placeholder="Image alt text (optional)"
            style={fieldStyle}
          />
          <input
            aria-label="Image link"
            defaultValue={config.imageLink || ""}
            name="imageLink"
            placeholder="Image link (optional)"
            style={fieldStyle}
          />
        </>
      )}
    </s-stack>
  );
}

function ReferralFields({config}: {config: ThankYouBlockConfig}) {
  return (
    <s-stack gap="base">
      <s-box padding="base" borderWidth="base" borderRadius="base">
        <s-text>
          You can use variables in the description: {"{friend_reward}"},{" "}
          {"{advocate_reward}"}, {"{referral_code}"}, and {"{referral_link}"}.
        </s-text>
      </s-box>

      <TextField
        label="Title"
        name="title"
        value={config.title || "Refer friends. Get rewards."}
        maxLength={80}
      />
      <TextAreaField
        label="Description"
        name="description"
        value={
          config.description ||
          "Give your friends {friend_reward} off all products. Get {advocate_reward} off all products when they purchase with your discount code {referral_code}."
        }
      />
      <TextField
        label="Share now text"
        name="shareLabel"
        value={config.shareLabel || "Share now:"}
        maxLength={40}
      />
      {/* <TextField
        label="Share button text"
        name="shareText"
        value={config.shareText || "Share"}
        maxLength={24}
      /> */}
      <TextField
        label="Friend reward"
        name="friendReward"
        value={config.friendReward || "15%"}
        maxLength={30}
      />
      <TextField
        label="Advocate reward"
        name="advocateReward"
        value={config.advocateReward || "$10"}
        maxLength={30}
      />
      <TextField
        label="Referral code"
        name="referralCode"
        value={config.referralCode || "THANKYOU15"}
        maxLength={40}
      />
      {/* <TextField
        label="Referral link"
        name="referralLink"
        value={config.referralLink || ""}
        placeholder="https://example.com/referral"
      /> */}
    </s-stack>
  );
}

function LoyaltyFields({config}: {config: ThankYouBlockConfig}) {
  return (
    <s-stack gap="base">
      <TextField
        label="Title"
        name="title"
        value={config.title || "Join our loyalty program"}
        maxLength={80}
      />
      <TextAreaField
        label="Description"
        name="description"
        value={
          config.description ||
          "Earn 2x points on future purchases and unlock member-only rewards."
        }
      />
      <TextField
        label="Points badge"
        name="pointsText"
        value={config.pointsText || "2x points"}
        maxLength={40}
      />
      <TextField
        label="Button text"
        name="buttonText"
        value={config.buttonText || "Join now"}
        maxLength={24}
      />
      <TextField
        label="Button link"
        name="buttonUrl"
        value={config.buttonUrl || ""}
        placeholder="https://example.com/account/register"
      />
      <TextField
        label="Valid until"
        name="validUntil"
        value={config.validUntil || ""}
        placeholder="Valid till Nov 31, 2026"
        maxLength={60}
      />
    </s-stack>
  );
}

function TextField({
  label,
  name,
  value,
  maxLength,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  maxLength?: number;
  placeholder?: string;
}) {
  return (
    <div>
      <label style={labelStyle} htmlFor={name}>
        {label}
      </label>
      <input
        defaultValue={value}
        id={name}
        maxLength={maxLength}
        name={name}
        placeholder={placeholder}
        style={fieldStyle}
      />
    </div>
  );
}

function TextAreaField({
  label,
  name,
  value,
}: {
  label: string;
  name: string;
  value: string;
}) {
  return (
    <div>
      <label style={labelStyle} htmlFor={name}>
        {label}
      </label>
      <textarea
        defaultValue={value}
        id={name}
        name={name}
        rows={5}
        style={fieldStyle}
      />
    </div>
  );
}

function BlockPreview({
  type,
  config,
}: {
  type: ThankYouBlockType;
  config: ThankYouBlockConfig;
}) {
  if (type === "referral") {
    const code = config.referralCode || "THANKYOU15";

    return (
      <s-box padding="base" borderWidth="base" borderRadius="base">
        <s-stack gap="small">
          <s-box padding="small" background="subdued" borderRadius="base">
            <s-text type="strong">{config.title || "Refer friends. Get rewards."}</s-text>
          </s-box>
          <s-text>
            {replaceReferralVariables(
              config.description ||
                "Give your friends {friend_reward} off all products. Get {advocate_reward} off all products when they purchase with your discount code {referral_code}.",
              config,
            )}
          </s-text>
          <s-text color="subdued">{config.shareLabel || "Share now:"}</s-text>
          <s-stack direction="inline" gap="small">
            <s-button>{config.shareText || "Share"}</s-button>
            <s-button variant="secondary">{code}</s-button>
          </s-stack>
        </s-stack>
      </s-box>
    );
  }

  if (type === "loyalty") {
    return (
      <s-box padding="base" borderWidth="base" borderRadius="base">
        <s-stack gap="small">
          <s-box padding="small" background="subdued" borderRadius="base">
            <s-text type="strong">{config.pointsText || "2x points"}</s-text>
          </s-box>
          <s-text type="strong">{config.title || "Join our loyalty program"}</s-text>
          <s-text>
            {config.description ||
              "Earn 2x points on future purchases and unlock member-only rewards."}
          </s-text>
          <s-button>{config.buttonText || "Join now"}</s-button>
          {config.validUntil && <s-text color="subdued">{config.validUntil}</s-text>}
        </s-stack>
      </s-box>
    );
  }

  return (
    <s-box padding="base" borderWidth="base" borderRadius="base">
      <s-text color="subdued">Save to preview this block on the thank-you page.</s-text>
    </s-box>
  );
}

function replaceReferralVariables(
  value: string,
  config: ThankYouBlockConfig,
) {
  return value
    .replaceAll("{friend_reward}", config.friendReward || "15%")
    .replaceAll("{advocate_reward}", config.advocateReward || "$10")
    .replaceAll("{referral_code}", config.referralCode || "THANKYOU15")
    .replaceAll("{referral_link}", config.referralLink || "");
}

function UpsellFields({config}: {config: ThankYouBlockConfig}) {
  return (
    <s-stack gap="base">
      <div>
        <label style={labelStyle} htmlFor="upsellHeading">
          Section header
        </label>
        <input
          defaultValue={config.upsellHeading || "Recommended products"}
          id="upsellHeading"
          width={70}
          name="upsellHeading"
          style={fieldStyle}
        />
      </div>
      <div>
        <label style={labelStyle} htmlFor="emptyMessage">
          Empty message
        </label>
        <input
          defaultValue={config.emptyMessage || "No recommendations found"}
          id="emptyMessage"
          maxLength={80}
          name="emptyMessage"
          style={fieldStyle}
        />
      </div>
      <s-box padding="base" borderWidth="base" borderRadius="base">
        <s-text>
          Product recommendations are pulled from each purchased product
          metafield: custom.recommended_products.
        </s-text>
      </s-box>
    </s-stack>
  );
}
