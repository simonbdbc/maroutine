function normalizeBasePath(value) {
  const normalized = String(value || "/app").trim();
  if (!normalized || normalized === "/") return "/";
  return `/${normalized.replace(/^\/+|\/+$/g, "")}`;
}

module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: normalizeBasePath(process.env.EXPO_PUBLIC_APP_BASE_PATH),
  },
});
