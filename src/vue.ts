import { defineComponent, onBeforeUnmount, onMounted, watch } from 'vue';

async function ensureMounted(accent?: string): Promise<void> {
  if (typeof window === 'undefined') return;
  if (accent) {
    window.__CHARLIE__ = { ...(window.__CHARLIE__ || {}), accent };
  }
  if (window.CharlieFixes) {
    window.CharlieFixes.mount();
  } else {
    const specifier = 'charlie-fixes';
    await import(/* @vite-ignore */ specifier);
  }
}

export const CharlieFixes = defineComponent({
  name: 'CharlieFixes',
  props: {
    accent: { type: String, required: false },
    enabled: { type: Boolean, default: true },
  },
  setup(props) {
    onMounted(() => {
      if (props.enabled) void ensureMounted(props.accent);
    });

    watch(
      () => props.enabled,
      (next) => {
        if (typeof window === 'undefined') return;
        if (next) void ensureMounted(props.accent);
        else window.CharlieFixes?.unmount();
      },
    );

    onBeforeUnmount(() => {
      if (typeof window === 'undefined') return;
      window.CharlieFixes?.unmount();
    });

    return () => null;
  },
});

export default CharlieFixes;
