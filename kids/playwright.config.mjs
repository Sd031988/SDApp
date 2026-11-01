import {defineConfig,devices} from '@playwright/test';
export default defineConfig({
  testDir:'./e2e',
  testMatch:'*.spec.mjs',
  timeout:45000,
  expect:{timeout:20000},
  retries:process.env.CI?1:0,
  workers:1,
  use:{
    baseURL:'http://127.0.0.1:4173',
    trace:'retain-on-failure',
    launchOptions:{args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']}
  },
  projects:[
    {name:'desktop-chromium',use:{...devices['Desktop Chrome']}},
    {name:'mobile-chromium',use:{...devices['Pixel 7']}}
  ],
  webServer:{
    command:'python3 -m http.server 4173 --bind 127.0.0.1',
    url:'http://127.0.0.1:4173/kids/',
    timeout:20000,
    reuseExistingServer:!process.env.CI
  }
});
