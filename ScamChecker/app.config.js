export default {
  name: "ScamChecker",
  slug: "ScamChecker", 
  version: "1.0.0",
  platforms: ["ios"],
  ios: {
    bundleIdentifier: "com.yourapp.scamchecker",
    buildNumber: "1.0.0",
    developmentTeam: process.env.EXPO_APPLE_TEAM_ID || "YOUR_TEAM_ID_HERE",
    entitlements: {
      "com.apple.security.application-groups": ["group.com.yourapp.scamchecker"]
    }
  },
  scheme: "scamchecker",
  developmentClient: {
    silentLaunch: false
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
  },
  plugins: [
    [
      "expo-build-properties",
      {
        ios: {
          useFrameworks: "static"
        }
      }
    ]
  ]
};
