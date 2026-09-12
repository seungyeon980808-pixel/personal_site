import {defineConfig} from '@playwright/test';
import puppeteer from 'puppeteer';
export default defineConfig({testDir:'tests/studio',timeout:30000,workers:2,use:{baseURL:'http://localhost:4321',browserName:'chromium',launchOptions:{executablePath:await puppeteer.executablePath()},viewport:{width:1280,height:900},screenshot:'only-on-failure'},reporter:[['list'],['json',{outputFile:'.omo/evidence/studio/tests.json'}]]});
