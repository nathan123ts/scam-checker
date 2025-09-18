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
