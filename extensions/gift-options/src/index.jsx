/* global globalThis */
/* eslint react/prop-types: off */
import '@shopify/ui-extensions/preact';
import {render} from 'preact';
import {useEffect, useRef, useState} from 'preact/hooks';
import {fetchActiveBlock} from '../../shared/blocks';
import {claimExtensionRender} from '../../shared/render-once';
import {limitText, trimText} from '../../shared/text';

const GIFT_WRAP_KEY = 'Gift wrap';
const GIFT_MESSAGE_KEY = 'Gift message';
const GIFT_MESSAGE_SAVE_DELAY_MS = 600;

export default () => {
  try {
    if (!claimExtensionRender('gift-options')) return;

    render(<Extension />, document.body);
  } catch (error) {
    console.error('Gift options failed to render:', error);
  }
};

function Extension() {
  const api = extensionApi();
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const attributes = useSignalValue(api?.attributes) || [];
  const giftWrapValue = attributeValue(attributes, GIFT_WRAP_KEY) === 'Yes';
  const giftMessageValue = attributeValue(attributes, GIFT_MESSAGE_KEY);
  const [giftMessageDraft, setGiftMessageDraft] = useState(giftMessageValue);
  const giftMessageDraftRef = useRef(giftMessageValue);
  const giftMessagePendingRef = useRef(false);
  const giftMessageSaveTimerRef =
    /** @type {{current: ReturnType<typeof setTimeout> | null}} */ (
      useRef(null)
    );

  useEffect(() => {
    let mounted = true;

    async function loadBlock() {
      try {
        const block = await fetchActiveBlock('giftOptions');

        if (mounted) setConfig(block?.config || null);
      } catch (loadError) {
        console.error(loadError);

        if (mounted) setConfig(null);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadBlock();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (giftMessagePendingRef.current) return;

    giftMessageDraftRef.current = giftMessageValue;
    setGiftMessageDraft(giftMessageValue);
  }, [giftMessageValue]);

  useEffect(() => {
    return () => {
      if (giftMessageSaveTimerRef.current) {
        clearTimeout(giftMessageSaveTimerRef.current);
      }
    };
  }, []);

  const updateAttribute = async (key, value) => {
    if (!api?.applyAttributeChange || !canUpdateAttributes) {
      setError('Gift options cannot be saved for this checkout.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const trimmedValue = trimText(value);
      const result = await api.applyAttributeChange(
        trimmedValue
          ? {type: 'updateAttribute', key, value: trimmedValue}
          : {type: 'removeAttribute', key},
      );

      if (result?.type === 'error') {
        setError(result.message || 'Could not save gift options.');
      }
    } catch (saveError) {
      setError(saveError?.message || 'Could not save gift options.');
    } finally {
      setSaving(false);
    }
  };

  const saveGiftMessage = async (value) => {
    await updateAttribute(GIFT_MESSAGE_KEY, value);

    if (
      !giftMessageSaveTimerRef.current &&
      giftMessageDraftRef.current === value
    ) {
      giftMessagePendingRef.current = false;
    }
  };

  const scheduleGiftMessageUpdate = (value) => {
    giftMessageDraftRef.current = value;
    giftMessagePendingRef.current = true;
    setGiftMessageDraft(value);

    if (giftMessageSaveTimerRef.current) {
      clearTimeout(giftMessageSaveTimerRef.current);
    }

    giftMessageSaveTimerRef.current = setTimeout(() => {
      giftMessageSaveTimerRef.current = null;
      saveGiftMessage(value);
    }, GIFT_MESSAGE_SAVE_DELAY_MS);
  };

  const flushGiftMessageUpdate = () => {
    if (!giftMessageSaveTimerRef.current) return;

    clearTimeout(giftMessageSaveTimerRef.current);
    giftMessageSaveTimerRef.current = null;
    saveGiftMessage(giftMessageDraftRef.current);
  };

  if (loading) {
    return (
      <s-box padding="base" border="base" borderRadius="base">
        <s-skeleton-paragraph />
      </s-box>
    );
  }

  if (!config || (config.giftWrapEnabled === false && config.giftMessageEnabled === false)) {
    return null;
  }

  const canUpdateAttributes =
    api?.instructions?.current?.attributes?.canUpdateAttributes !== false;

  return (
    <s-stack gap="base">
      <s-text type="strong">
        {limitText(trimText(config.giftOptionsHeading) || 'Gift options', 80)}
      </s-text>

      {config.giftWrapEnabled !== false && (
        <s-checkbox
          checked={giftWrapValue}
          disabled={saving || !canUpdateAttributes}
          label={limitText(trimText(config.giftWrapLabel) || 'Add gift wrap', 80)}
          onChange={(event) =>
            updateAttribute(
              GIFT_WRAP_KEY,
              checkedFromEvent(event) ? 'Yes' : '',
            )
          }
        />
      )}

      {config.giftMessageEnabled !== false && (
        <s-text-area
          label={limitText(
            trimText(config.giftMessageLabel) || 'Gift message',
            80,
          )}
          value={giftMessageDraft}
          placeholder={
            trimText(config.giftMessagePlaceholder) ||
            'Write a message for the recipient'
          }
          maxLength={500}
          rows={4}
          disabled={!canUpdateAttributes}
          onInput={(event) =>
            scheduleGiftMessageUpdate(valueFromEvent(event))
          }
          onBlur={flushGiftMessageUpdate}
        />
      )}

      {error && <s-text tone="critical">{error}</s-text>}
    </s-stack>
  );
}

function useSignalValue(signal) {
  const [value, setValue] = useState(signalValue(signal));

  useEffect(() => {
    if (!signal?.subscribe) return undefined;

    const unsubscribe = signal.subscribe((nextValue) => {
      setValue(nextValue);
    });

    setValue(signalValue(signal));

    return () => {
      unsubscribe();
    };
  }, [signal]);

  return value;
}

function signalValue(signal) {
  return signal?.value || signal?.current;
}

function attributeValue(attributes, key) {
  const attribute = attributes.find((item) => item?.key === key);

  return trimText(attribute?.value);
}

function checkedFromEvent(event) {
  return Boolean(/** @type {{checked?: boolean} | null} */ (event?.target)?.checked);
}

function valueFromEvent(event) {
  return String(/** @type {{value?: string} | null} */ (event?.target)?.value || '');
}

function extensionApi() {
  return typeof globalThis !== 'undefined' ? globalThis.shopify : shopify;
}
