const puppeteer = require("puppeteer");
const cheerio = require("cheerio");
const scroll = require("./helpers/autoScroll");
const settings = require("./settings/settings");
const serviceAccount = require("./firebase-store-node-firebase-adminsdk-tja8v-ce3e6b28f0.json");
const firebaseAdmin = require('firebase-admin');
const uniqid = require('uniqid');
const save = require("./helpers/saveImage");


const testUrl = "https://www.citilink.ru/catalog/smartfony";
const baseUrl = "https://www.citilink.ru";
//https://items.s1.citilink.ru/1391508_v02_b.jpg

const fireBaseSave = async (imgUrl, storageRef) => {
    const {name} = await save.saveImage(imgUrl);
    const storage = await storageRef.upload(`./images/${name}`, {
        public: true,
        destination: name,
        metadata: {
            firebaseStorageDownloadTokens: uniqid()
        }
    });
    console.log(storage[0].metadata.mediaLink);
    return storage[0].metadata.mediaLink;
}


const parseData = async (url, page) => {
    try {
        const SELECTOR_1 = "div.Specifications__column.Specifications__column_name";
        const SELECTOR_2 = "div.Specifications__column.Specifications__column_value";
        const SELECTOR_3 = ".ProductHeader__price-default_current-price";
        const SELECTOR_4 = ".ProductHeader.js--ProductHeader";
        const SELECTOR_5 = "div.swiper-slide.PreviewList__li.PreviewList__item > img";
        const SELECTOR_6 = "div.SpecificationsFull:nth-child(1) > div:nth-child(2) > div:nth-child(1) > div:nth-child(2)";
        const SELECTOR_7 = "div.Breadcrumbs:nth-child(3) > a:nth-child(1) > span:nth-child(1)";

        const content = await getContent(url, page);
        let $ = cheerio.load(content);
        const productName = $("h1.Heading").text().trim().split(" ").slice(1).join(" ");
        const price = $(SELECTOR_4).find(SELECTOR_3).text().trim();
        const images = new Set();
        $(SELECTOR_5).each((ind, img) => {
            const url = $(img).attr("src");
            if (url) {
                if (url.includes("v01") ||
                    url.includes("v02") ||
                    url.includes("v03") ||
                    url.includes("v04") ||
                    url.includes("v05")
                ) {
                    images.add(url);
                }
            };
        });
        const categoryRus = $(SELECTOR_6).text().trim();
        const company = $(SELECTOR_7).text().trim();
        const id = uniqid();
        const description = [];
        $(".SpecificationsFull").each((i, el) => {
            const data = {};
            const title = $(el).find(".SpecificationsFull__title").text().trim();
            if (title) {
                data.title = title;
                data.description = {};
                $(el).find(".Specifications__row").each((ind, elem) => {
                    $(elem).find("div.Tooltip.js--Tooltip.js--Tooltip_click").remove();
                    const col_name = $(elem).find(SELECTOR_1).text().trim();
                    const col_value = $(elem).find(SELECTOR_2).text().trim();
                    if (!data.description[col_name]) {
                        data.description[col_name] = col_value;
                    }
                });
            };
            if (Object.keys(data).length !== 0) {
                description.push(data);
            }
        });
        return { productName, categoryRus, company, price, id, images: [...images], description };
    } catch (e) {
        throw e;
    }
}

async function* imagesSaved(images, storageRef) {
    try {
        const firebaseUrlsImages = [];
        for(let i = 0; i < images.length; i++) {
            const url = await fireBaseSave(images[i], storageRef);
            firebaseUrlsImages.push(url);
        }
        yield firebaseUrlsImages
    } catch(e) {
        throw e;
    }
}


async function* scrapData(urls, browser, storageRef) {
    try {
        for (let i = 0; i < urls.length; i++) {
            const currUrl = `${urls[i]}properties`
            const page = await browser.newPage();
            await page.goto(currUrl, settings.PAGE_PUPPETEER_OPTS);
            console.log(`page: ${currUrl}`);
            const data = await parseData(currUrl, page);
            const generator = imagesSaved(data.images, storageRef);
            for await(let value of generator) {
                data.images = value;
            };
            page.close();
            yield data;
        }
    } catch (e) {
        throw e;
    }
}

const getContent = async (url, page) => {
    try {
        await page.goto(url, settings.PAGE_PUPPETEER_OPTS);
        await scroll.autoScroll(page);
        const content = await page.content();
        return content;
    } catch (e) {
        throw e;
    }
}

const main = async (url, baseUrl) => {
    try {
        const admin = firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert(serviceAccount),
        });
        const storageRef = admin.storage().bucket(`gs://firebase-store-node.appspot.com`);
        const browser = await puppeteer.launch(settings.LAUNCH_PUPPETEER_OPTS);
        const page = await browser.newPage();
        await page.setViewport(settings.VIEWPORT);
        const content = await getContent(url, page);
        let $ = cheerio.load(content);
        const pageProductUrls = [];
        $("div.product_data__gtm-js > div:nth-child(3) > a:nth-child(1)").each((i, el) => {
            const attr = $(el).attr("href");
            const resultUrl = `${baseUrl}${attr}`;
            pageProductUrls.push(resultUrl);
        });
        console.log('pageProductUrls')
        page.close();
        let generator = scrapData(pageProductUrls, browser, storageRef);
        console.log('generator start')
        for await(let data of generator) {
            console.log('checked');
            console.log(data);
        }
    } catch (e) {
        console.log(e);
        return e;
    }
}
main(testUrl, baseUrl);
