module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      // NativeWind v4 needs both jsxImportSource and the NativeWind preset.
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // ⚠️  SDK 54 + Reanimated v4 : NE PAS ajouter react-native-reanimated/plugin
      // Il est inclus automatiquement via babel-preset-expo (sinon duplicate warning)
      // Path aliases — doit correspondre à tsconfig paths
      [
        "module-resolver",
        {
          root: ["./"],
          alias: {
            "@features": "./src/features",
            "@shared": "./src/shared",
            "@navigation": "./src/navigation",
            "@assets": "./assets",
          },
        },
      ],
    ],
  };
};
