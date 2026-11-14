import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Hide the floating "N" dev badge — it looked like a hidden admin button.
  // Compile/runtime errors are still shown in development.
  devIndicators: false,
}

export default nextConfig;
