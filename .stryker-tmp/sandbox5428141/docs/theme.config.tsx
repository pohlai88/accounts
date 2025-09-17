// @ts-nocheck
import React from "react";
import { DocsThemeConfig } from "nextra-theme-docs";

const config: DocsThemeConfig = {
  logo: <span>AI-BOS Accounts</span>,
  project: {
    link: "https://github.com/aibos/accounts",
  },
  chat: {
    link: "https://discord.gg/aibos",
  },
  docsRepositoryBase: "https://github.com/aibos/accounts/tree/main/docs",
  footer: {
    text: "AI-BOS Accounts Documentation © 2024",
  },
  search: {
    placeholder: "Search documentation...",
  },
  editLink: {
    text: "Edit this page on GitHub →",
  },
  feedback: {
    content: "Question? Give us feedback →",
    labels: "feedback",
  },
  toc: {
    backToTop: true,
  },
  navigation: {
    prev: true,
    next: true,
  },
  gitTimestamp: ({ timestamp }) => <span>Last updated on {timestamp.toLocaleDateString()}</span>,
  darkMode: true,
  primaryHue: 210,
  primarySaturation: 100,
};

export default config;
