export interface ToolLink {
  name: string;
  href: string;
  description: string;
  emoji: string;
}

// Add new tools here. Each is a standalone page on this site (see vite.config.ts rollupOptions.input).
export const TOOLS: ToolLink[] = [
  {
    name: "Marquee",
    href: "/tools/marquee/",
    description: "Make a light-up marquee sign for your iPad. Works offline.",
    emoji: "🎪",
  },
  {
    name: "ChildFirst Photo Export",
    href: "/tools/downloadphotos/",
    description: "Download your own child's photos from the ChildFirst app, right in your browser.",
    emoji: "📸",
  },
];
