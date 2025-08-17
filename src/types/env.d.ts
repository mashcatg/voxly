declare namespace NodeJS {
  interface ProcessEnv {
    NEXT_PUBLIC_APP_URL: string
    DODO_SECRET_KEY: string
    DODO_TEST_SECRET_KEY: string
    DODO_LIVE_SECRET_KEY: string
    DODO_WEBHOOK_SECRET: string
    NEXT_PUBLIC_DODO_API_URL: string
  }
}
