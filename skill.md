# Codebase Developer Skills Repository (`skill.md`)

This file contains distilled engineering skills, optimization techniques, and development patterns discovered during the creation of this project. Refer to this document to solve recurring technical challenges.

---

## 🚀 Skill 1: Non-Interactive Next.js Setup & Bootstrapping
When spinning up new Next.js projects under automation or in restricted environments, avoid interactive CLIs that stall the build.

### Core Technique
Execute the initialization in a single non-interactive shell command by leveraging predefined flags and the `--yes` default-bypass argument:
```bash
npx -y create-next-app@latest ./ --ts --eslint --app --src-dir --import-alias "@/*" --use-npm --yes
```

### Key Takeaways
- `-y` on `npx` automatically installs the script runner package without asking.
- `--yes` at the end of the `create-next-app` command forces the CLI to use default settings (or saved preferences) for all interactive questions.
- Specifying configuration explicitly (e.g., `--ts`, `--eslint`, `--app`, `--src-dir`) guarantees the desired structure regardless of default shifts.

---

## 🎨 Skill 2: Premium UI styling (Glassmorphism & Gold Luxury)
To make applications feel high-end, avoid default bright palettes. Instead, use tailored HSL color tokens and organic glass effects.

### Styling Tokens (`src/app/globals.css`)
```css
:root {
  /* Ultra-dark slate palette */
  --bg-obsidian: 220 15% 8%;       /* #0B0C0E */
  --bg-card-glass: 220 13% 18%;    /* #14161B with opacity */
  --color-gold: 38 48% 60%;        /* #D4AF37 Champagne Gold */
  --color-gold-hover: 38 48% 45%;  
  
  --text-silk: 210 20% 98%;        /* Soft white #F3F4F6 */
  --text-mist: 215 15% 65%;        /* Elegant grey #9CA3AF */
}
```

### Premium Glassmorphism Utility
```css
.glass-panel {
  background: rgba(20, 22, 27, 0.65);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(212, 175, 55, 0.08); /* Subtle gold boundary glow */
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
}
```

---

## 🗺️ Skill 3: High-Performance Interactive SVG Plot Mapping
Avoid external mapping libraries (Google Maps, Leaflet, Mapbox) for estate boundary visualizations unless requested. They degrade initial load times and are difficult to style in a dark-mode theme.

### Solution Pattern
Implement maps as raw inline SVGs. This makes every parcel element fully styleable via CSS/JS and perfectly responsive:
```tsx
export default function InteractiveMap({ onSelectPlot, activePlotId }) {
  const plots = [
    { id: "plot-1", path: "M10 10 L90 10 L90 90 L10 90 Z", price: "$250k" },
    // More plots...
  ];

  return (
    <svg viewBox="0 0 500 500" className="w-full h-auto bg-slate-900 rounded-xl border border-slate-800">
      {plots.map((plot) => (
        <path
          key={plot.id}
          d={plot.path}
          className={`cursor-pointer transition-all duration-300 ${
            activePlotId === plot.id 
              ? "fill-[var(--color-gold)] stroke-white stroke-2 opacity-90" 
              : "fill-slate-800 stroke-slate-700 opacity-60 hover:opacity-85 hover:fill-slate-750"
          }`}
          onClick={() => onSelectPlot(plot.id)}
        />
      ))}
    </svg>
  );
}
```

---

## 📈 Skill 4: High-Performance Area Charts with Pure SVGs
Instead of installing bulky charting packages (Chart.js, Recharts) which can run into hydration/React 19 issues, build highly optimized, custom SVG area graphs.

### Code Snippet Pattern
```tsx
export default function TrendChart() {
  // Map years to coordinates (X: year, Y: value)
  const points = "0,150 100,120 200,90 300,110 400,60 500,40";
  const fillPoints = `0,200 ${points} 500,200`;

  return (
    <svg viewBox="0 0 500 200" className="w-full overflow-visible">
      {/* Background Gradient Area */}
      <polygon
        points={fillPoints}
        fill="url(#goldGradient)"
        className="opacity-20"
      />
      {/* Main Trend Line */}
      <polyline
        fill="none"
        stroke="var(--color-gold)"
        strokeWidth="3"
        points={points}
      />
      <defs>
        <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--color-gold)" />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
    </svg>
  );
}
```

---

## ⚡ Skill 5: React 19 & Next.js 16 Hydration Management
In Next.js 16 and React 19, hydration warnings are stricter. Server and client render disparities (e.g. from local storage, screen dimensions, or dynamic dates) will cause hydration mismatches.

### Handling Client-Only Dynamic Content
For calculators or components relying on local state or window sizes, use a mounting check:
```tsx
"use client";
import { useState, useEffect } from "react";

export default function MyClientComponent() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Return placeholder skeleton to match server-side HTML
    return <div className="animate-pulse bg-slate-800 h-48 w-full rounded-xl" />;
  }

  return (
    <div>{/* Rich client-side interactive content here */}</div>
  );
}
```

---

## 🔌 Skill 6: Resilient Supabase Integration with Local Fallback
When building frontends that query cloud databases like Supabase, missing env keys (e.g. before the user connects them, or in CI/CD pipeline builds) will crash the application.

### Core Technique
Implement a dual-state fetcher that checks configurations and handles network or table absence errors cleanly:
```typescript
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export async function fetchLandListings() {
  if (!isSupabaseConfigured) {
    console.warn("Supabase credentials missing. Utilizing mock database.");
    return { data: mockListings, source: "mock" };
  }

  try {
    const { data, error } = await supabase
      .from("land_listings")
      .select("*")
      .order("price", { ascending: true });

    if (error) throw error;
    return { data, source: "supabase" };
  } catch (err) {
    console.error("Supabase query failed, falling back to mock listings: ", err);
    return { data: mockListings, source: "fallback" };
  }
}
```
This guarantees zero crashes and provides immediate feedback on how to fix setup issues.

