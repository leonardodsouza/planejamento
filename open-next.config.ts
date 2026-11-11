import { defineCloudflareConfig } from "@opennextjs/cloudflare";

const config = defineCloudflareConfig();

// `npm run build` (comando padrão do Cloudflare) gera o bundle do OpenNext;
// o build do Next.js em si roda por `npm run build:next`.
export default { ...config, buildCommand: "npm run build:next" };
