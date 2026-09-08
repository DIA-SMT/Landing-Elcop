/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Las portadas de las publicaciones viven en el Storage de Supabase; sin
    // esto, next/image se niega a optimizar una URL remota.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }]
  }
};

export default nextConfig;
