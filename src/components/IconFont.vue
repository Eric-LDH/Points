<template>
  <i
    class="iconfont"
    :class="customClass"
    :style="iconStyle"
    v-html="iconSvg"
    :title="name"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(defineProps<{
  name: keyof typeof icons
  size?: number | string
  color?: string
  customClass?: string
}>(), {
  size: 22,
  color: 'currentColor',
  customClass: ''
})

const iconSvg = computed(() => {
  const svg = icons[props.name]
  return svg || ''
})

const iconStyle = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size
  return {
    width: size,
    height: size,
    color: props.color,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
})

const icons = {
  home: '<svg viewBox="0 0 24 24"><path d="M12 3L4 9v12h5v-7h6v7h5V9z"/></svg>',
  chart: '<svg viewBox="0 0 24 24"><path d="M5 19V9h3v10H5zm6 0V5h3v14h-3zm6 0v-7h3v7h-3z"/></svg>',
  clover: '<svg viewBox="0 0 24 24"><path d="M12 2C9.5 4.5 7 5 5 7s-1 5 2 7c-3 2-3 5-1 7s4 2 6 0c2 2 4 2 6 0s2-5-1-7c3-2 3-5 1-7s-3.5-2.5-6-5zM12 6c1.5 2 3 2.5 4 3.5s.5 3-1 4c1.5 1 1.5 2.5.5 3.5s-2.5 1-3.5-.5c-1 1.5-2.5 1.5-3.5.5s-1-2.5.5-3.5c-1.5-1-2-2.5-1-4S10.5 8 12 6z" fill-rule="evenodd"/></svg>',
  gift: '<svg viewBox="0 0 24 24"><path d="M20 6h-2.18A3 3 0 0 0 15 2a3 3 0 0 0-2.82 2h-.36A3 3 0 0 0 9 2a3 3 0 0 0-2.82 4H4a2 2 0 0 0-2 2v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2zM15 4a1 1 0 1 1 0 2h-1.5a1 1 0 0 1 .97-1.18L15 4zm-6 0a1 1 0 0 1 .97 1.18H9a1 1 0 0 1 0-2zM4 14v5a2 2 0 0 0 2 2h5v-7H4zm9 7h5a2 2 0 0 0 2-2v-5h-7v7z"/></svg>',
  user: '<svg viewBox="0 0 24 24"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/></svg>',
  list: '<svg viewBox="0 0 24 24"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>',
  settings: '<svg viewBox="0 0 24 24"><path d="M19.14 12.94a7.07 7.07 0 0 0 .06-.94c0-.32-.02-.64-.07-.94l2.03-1.58a.49.49 0 0 0 .12-.61l-1.92-3.32a.49.49 0 0 0-.59-.22l-2.39.96a6.9 6.9 0 0 0-1.62-.94l-.36-2.54a.484.484 0 0 0-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96a.49.49 0 0 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.07.62-.07.94s.02.64.07.94l-2.03 1.58a.49.49 0 0 0-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.37 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2z"/></svg>',
  calendar: '<svg viewBox="0 0 24 24"><path d="M19 3h-1V1h-2v2H8V1H6v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2zm0 16H5V8h14v11z"/></svg>',
  backup: '<svg viewBox="0 0 24 24"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 1 0 9 9c0-.46-.04-.92-.1-1.36a5.389 5.389 0 0 1-4.4 2.26 5.403 5.403 0 0 1-3.14-9.8c-.44-.06-.9-.1-1.36-.1z"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><path d="M12 7c-2.76 0-5 2.24-5 5s2.24 5 5 5 5-2.24 5-5-2.24-5-5-5zm-1-6v4h2V1h-2zm0 18v4h2v-4h-2zm8.84-14.16l-2.82 2.82 1.41 1.41 2.82-2.82-1.41-1.41zm-14.14 0l-1.41 1.41 2.82 2.82 1.41-1.41-2.82-2.82zM23 12h-4v2h4v-2zM5 12H1v2h4v-2zm13.01 5.66l-1.41 1.41 2.82 2.82 1.41-1.41-2.82-2.82zm-14.14 0l-2.82 2.82 1.41 1.41 2.82-2.82-1.41-1.41z"/></svg>',
  notes: '<svg viewBox="0 0 24 24"><path d="M3 18h12v-2H3v2zM3 6v2h18V6H3zm0 7h18v-2H3v2z"/></svg>',
  edit: '<svg viewBox="0 0 24 24"><path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/></svg>',
  add: '<svg viewBox="0 0 24 24"><path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z"/></svg>',
  close: '<svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24"><path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6-1.41-1.41z"/></svg>',
  check: '<svg viewBox="0 0 24 24"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>',
  delete: '<svg viewBox="0 0 24 24"><path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z"/></svg>',
  search: '<svg viewBox="0 0 24 24"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/></svg>',
  trophy: '<svg viewBox="0 0 24 24"><path d="M19 5h-2V3H7v2H5c-1.1 0-2 .9-2 2v1c0 2.55 1.92 4.63 4.39 4.94.63 1.5 1.98 2.63 3.61 2.96V19H7v2h10v-2h-4v-3.1c1.63-.33 2.98-1.46 3.61-2.96C19.08 12.63 21 10.55 21 8V7c0-1.1-.9-2-2-2zM7 10.82C5.84 10.4 5 9.3 5 8V7h2v3.82zm10 .18V7h2v1c0 1.3-.84 2.4-2 2.82z"/></svg>',
  history: '<svg viewBox="0 0 24 24"><path d="M13 3a9 9 0 0 0-9 9H1l3.89 3.89.07.14L9 12H6c0-3.87 3.13-7 7-7s7 3.13 7 7-3.13 7-7 7c-1.93 0-3.68-.79-4.94-2.06l-1.42 1.42A8.954 8.954 0 0 0 13 21a9 9 0 0 0 0-18zm-1 5v5l4.28 2.54.72-1.21-3.5-2.08V8H12z"/></svg>',
  star: '<svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>',
  dice: '<svg viewBox="0 0 24 24"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V5h14v14zM7.5 9C6.67 9 6 8.33 6 7.5S6.67 6 7.5 6 9 6.67 9 7.5 8.33 9 7.5 9zm9 0c-.83 0-1.5-.67-1.5-1.5S15.67 6 16.5 6 18 6.67 18 7.5 17.33 9 16.5 9zM7.5 18C6.67 18 6 17.33 6 16.5S6.67 15 7.5 15s1.5.67 1.5 1.5S8.33 18 7.5 18zm4.5-4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5zm4.5 4.5c-.83 0-1.5-.67-1.5-1.5s.67-1.5 1.5-1.5 1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>',
}
</script>

<style scoped>
.iconfont {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  vertical-align: middle;
}

.iconfont :deep(svg) {
  width: 100%;
  height: 100%;
  fill: currentColor;
  transition: fill 0.2s ease;
}
</style>
