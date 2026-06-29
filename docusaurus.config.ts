import { themes as prismThemes } from "prism-react-renderer";
import type { Config } from "@docusaurus/types";
import type * as Preset from "@docusaurus/preset-classic";

// ⚠️ Khi deploy GitHub Pages, đặt 3 biến dưới cho khớp repo của bạn:
//   - ORG  = owner GitHub (user/tổ chức)
//   - REPO = tên repository (cũng là baseUrl: /REPO/)
// Có thể override qua biến môi trường trong CI.
const ORG = process.env.DOCS_ORG ?? "satarobo";
const REPO = process.env.DOCS_REPO ?? "satarobo_document";

const config: Config = {
  title: "Sata Robo — Tài liệu Kiến trúc",
  tagline: "C4 + arc42 · Brand hub + Admin CMS + Portal phụ huynh (Đà Nẵng)",
  favicon: "img/favicon.svg",

  url: `https://${ORG}.github.io`,
  baseUrl: `/${REPO}/`,

  organizationName: ORG,
  projectName: REPO,

  // Khung đang xây — link nội bộ tới trang chưa có sẽ cảnh báo, không chặn build.
  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",
  onBrokenAnchors: "warn",

  i18n: {
    defaultLocale: "vi",
    locales: ["vi"],
  },

  // Bật Mermaid để render sơ đồ C4 (C4Context / C4Container / C4Component / C4Dynamic / C4Deployment).
  markdown: {
    mermaid: true,
  },
  themes: ["@docusaurus/theme-mermaid"],

  presets: [
    [
      "classic",
      {
        docs: {
          routeBasePath: "/", // Site là một bộ tài liệu thuần — docs nằm ở gốc.
          sidebarPath: "./sidebars.ts",
          // Giữ tiền tố số chương (NN-) trong URL để khớp link & lộ số chương arc42.
          // Thứ tự sidebar do `_category_.json` (position) + `sidebar_position` quyết định.
          numberPrefixParser: false,
          editUrl: `https://github.com/${ORG}/${REPO}/edit/main/`,
        },
        blog: false,
        theme: {
          customCss: "./src/css/custom.css",
        },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: "img/logo.svg",
    colorMode: {
      defaultMode: "light",
      respectPrefersColorScheme: true,
    },
    mermaid: {
      theme: { light: "neutral", dark: "dark" },
    },
    navbar: {
      title: "Sata Robo Docs",
      logo: {
        alt: "Sata Robo",
        src: "img/logo.svg",
      },
      items: [
        {
          type: "docSidebar",
          sidebarId: "arc42",
          position: "left",
          label: "Kiến trúc (arc42)",
        },
        {
          to: "/06-runtime-luong",
          label: "Luồng LMS",
          position: "left",
        },
        {
          to: "/07-trien-khai",
          label: "Triển khai / Container",
          position: "left",
        },
        {
          href: `https://github.com/${ORG}/${REPO}`,
          label: "GitHub",
          position: "right",
        },
      ],
    },
    footer: {
      style: "dark",
      links: [
        {
          title: "Kiến trúc",
          items: [
            { label: "Bối cảnh (C4 L1)", to: "/03-pham-vi-boi-canh" },
            { label: "Khối xây dựng (C4 L2/L3)", to: "/05-khoi-xay-dung" },
            { label: "Triển khai (C4 Deployment)", to: "/07-trien-khai" },
          ],
        },
        {
          title: "Luồng nghiệp vụ",
          items: [
            { label: "Phòng Đào tạo", to: "/06-runtime-luong/phong-dao-tao" },
            { label: "Giáo viên", to: "/06-runtime-luong/giao-vien" },
            { label: "Phụ huynh", to: "/06-runtime-luong/phu-huynh" },
          ],
        },
        {
          title: "Khác",
          items: [
            { label: "Quyết định kiến trúc (ADR)", to: "/09-quyet-dinh-kien-truc" },
            { label: "Rủi ro & nợ kỹ thuật", to: "/11-rui-ro-no-ky-thuat" },
            { label: "Thuật ngữ", to: "/12-thuat-ngu" },
          ],
        },
      ],
      copyright: `Sata Robo VN · Tài liệu kiến trúc (C4 + arc42) · cập nhật ${new Date().getFullYear()}`,
    },
    prism: {
      theme: prismThemes.github,
      darkTheme: prismThemes.dracula,
      additionalLanguages: ["bash", "json", "sql", "tsx", "typescript"],
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
