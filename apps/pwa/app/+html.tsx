import type { PropsWithChildren } from "react";
import { ThemeColors } from "@shared/theme";
import { CANONICAL_APP_ORIGIN, resolveAppAssetUrl } from "@shared/pwa/appConfig";

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content={ThemeColors.primary} />
        <meta name="application-name" content="Maroutine" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Maroutine" />
        <meta
          name="description"
          content="Application de routines quotidiennes gamifiees pour les familles."
        />
        <link rel="canonical" href={`${CANONICAL_APP_ORIGIN}/`} />
        <link rel="manifest" href={resolveAppAssetUrl("/manifest.webmanifest")} />
        <link
          rel="apple-touch-icon"
          href={resolveAppAssetUrl("/icons/apple-touch-icon-20260604.png")}
        />
        <script src={resolveAppAssetUrl("/install-prompt-bridge.js")} />
      </head>
      <body style={{ backgroundColor: ThemeColors.white, color: ThemeColors.black }}>
        {children}
      </body>
    </html>
  );
}
