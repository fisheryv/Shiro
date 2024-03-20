export const appStaticConfig = {
  ai: {
    summary: {
      enabled: true,
      // providers: ['openai', 'xlog'],
      providers: ['openai'],
    },
  },

  cache: {
    enabled: true,
  },
}

export const CDN_HOST = 'cdn.innei.ren'
export const TENCENT_CDN_DOMAIN = CDN_HOST
