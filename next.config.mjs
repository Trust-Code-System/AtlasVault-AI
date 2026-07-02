/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: import.meta.dirname,
  serverExternalPackages: ["@prisma/client", "pdf-parse", "mammoth", "docx", "bcryptjs", "pdfmake"],
  experimental: {
    serverActions: {
      bodySizeLimit: "25mb",
    },
  },
};

export default nextConfig;
