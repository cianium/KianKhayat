import {defineConfig} from '@playwright/test';
export default defineConfig({
  testDir:'./tests', testMatch:'**/*.spec.ts', fullyParallel:false, workers:1,
  reporter:[['list'],['json',{outputFile:'docs/browser-test-results.json'}]],
  use:{baseURL:'http://127.0.0.1:4322',viewport:{width:390,height:844},colorScheme:'light'},
  webServer:{command:'TEST_MEDIA=1 node scripts/test-server.mjs',url:'http://127.0.0.1:4322',reuseExistingServer:false}
});
