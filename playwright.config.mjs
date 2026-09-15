import {defineConfig} from '@playwright/test';
import puppeteer from 'puppeteer';

export default defineConfig({
 testDir:'tests/studio',timeout:30000,workers:2,
 use:{baseURL:'http://127.0.0.1:4322',browserName:'chromium',launchOptions:{executablePath:await puppeteer.executablePath()},viewport:{width:1280,height:900},screenshot:'only-on-failure'},
 webServer:{command:'npm run build && npm run preview:studio',url:'http://127.0.0.1:4322/?entrance=closed',reuseExistingServer:false,timeout:60000,env:{PORT:'4322'}},
 reporter:[['list'],['json',{outputFile:'.omo/evidence/studio/tests.json'}]]
});
