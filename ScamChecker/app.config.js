export default {
  name: "ScamChecker",
  slug: "ScamChecker", 
  version: "1.0.0",
  platforms: ["ios"],
  ios: {
    bundleIdentifier: "com.yourapp.scamchecker",
    buildNumber: "1.0.0"
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
