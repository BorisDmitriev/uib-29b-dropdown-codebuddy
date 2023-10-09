const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');
let browser;
let page;

beforeAll(async () => {
    browser = await puppeteer.launch()
    page = await browser.newPage();
    await page.goto('file://' + path.resolve('./index.html'))
    await page.setViewport({ width: 1080, height: 500 });
});

afterAll(async () => {
    await browser.close()
});

describe('Task1: Check HTML structure', () => {
    test('`index.html` file exists', async () => {
        const filePath = path.resolve('./index.html');
        expect(fs.existsSync(filePath)).toBe(true);
    });
    test('html document type declaration is present', async () => {
        const doctype = await page.evaluate(() => document.doctype.name);
        expect(doctype).toBe('html');
    });
    test('Page should contain a `meta` tag with `charset` attribute', async () => {
        const meta = await page.$('meta[charset]');
        expect(meta).not.toBeNull();
    });
    test('Page should contain a `title` tag with content', async () => {
        const title = await page.$('title');
        expect(title).not.toBeNull();
        const titleContent = await page.evaluate(() => document.title);
        expect(titleContent).not.toBe('');
    });
    test('Page should contain a `link` tag with `rel="stylesheet"` attribute', async () => {
        const link = await page.$('link[rel="stylesheet"]');
        expect(link).not.toBeNull();
    });
    test('Page should contain a `favicon` link', async () => {
        const link = await page.$('link[rel="shortcut icon"]');
        expect(link).not.toBeNull();
    });
    test('Page should contain `header` tag', async () => {
        const header = await page.$('header');
        expect(header).not.toBeNull();
    });
    test('Header should contain `nav` tag', async () => {
        const nav = await page.$('header nav');
        expect(nav).not.toBeNull();
    });
});
describe('Task2: check the content', () => {
    test('page header should contain logo image', async () => {
        const logo = await page.$('header img');
        expect(logo).not.toBeNull();
    });
    test('Page navigation should contain links', async () => {
        const links = await page.$$('nav a');
        expect(links.length).toBeGreaterThan(1);
    });
    test('Page should contain images', async () => {
        const images = await page.$$('img');
        expect(images.length).toBeGreaterThan(3);
    });
    test('Page should contain paragraphs', async () => {
        // get all elements has more than 10 words directly inside
        const paragraphs1 = await page.evaluate(() => {
            const elements = Array.from(document.querySelectorAll('*')).filter(el => {
                const text = el.textContent.trim();
                return text.split(' ').length > 10;
            });
            return elements.length;
        });
        const paragraphs = await page.$$eval('*', (elements) => {
            return elements.filter((element) => {
                const text = element.innerText;
                const words = text.split(' ');
                return words.length > 10;
            });
        });
        expect(paragraphs.length).toBeGreaterThan(2);
    });
});
describe('Task3: Check styles', () => {
    test('The navigation element should be at the top of the page', async () => {
        // get the top position of the nav element
        const navTop = await page.evaluate(() => {
            const nav = document.querySelector('nav');
            const { top } = nav.getBoundingClientRect();
            return top;
        });
        expect(navTop).toBeLessThan(20);// less than 20px from the top of the page is ok
    });
    test('The navigation elements should be horizontally aligned', async () => {
        // get the position top of all a elements inside the nav element
        const navLinks = await page.evaluate(() => {
            const nav = document.querySelector('nav');
            const links = Array.from(nav.querySelectorAll('a'));
            return links.map(link => {
                const { top } = link.getBoundingClientRect();
                return top;
            });
        });
        // check if all links have the same top position
        const isAligned = navLinks.every((top, i, arr) => top === arr[0]);
        expect(isAligned).toBe(true);
    });
    test('The logo should be aligned to the left', async () => {
        // get the left position of the logo element
        const logoLeft = await page.evaluate(() => {
            const logo = document.querySelector('header img');
            const { left } = logo.getBoundingClientRect();
            return left;
        });
        // get page width
        const pageWidth = await page.evaluate(() => {
            const { width } = document.body.getBoundingClientRect();
            return width;
        });
        // check if the logo is aligned to the left
        expect(logoLeft).toBeLessThan(pageWidth / 2);
    });
    test('The background color of the navigation Menu links should change when the mouse hovers over them', async () => {
        // get all elements styles inside the header element
        const styles = await page.evaluate(() => {
            const header = document.querySelector('header');
            const elements = Array.from(header.querySelectorAll('*'));
            return elements.map(elements => {
                const { backgroundColor } = window.getComputedStyle(elements);
                return backgroundColor;
            });
        });
        // hover over the first link
        await page.hover('nav a:first-child');
        // wait for the hover effect to be applied
        await page.waitForTimeout(1000);
        // get the styles again after hover
        const stylesHover = await page.evaluate(() => {
            const header = document.querySelector('header');
            const elements = Array.from(header.querySelectorAll('*'));
            return elements.map(elements => {
                const { backgroundColor } = window.getComputedStyle(elements);
                return backgroundColor;
            });
        });
        // check if the background color changed
        expect(styles).not.toBe(stylesHover); // the styles should be different
    });
    test('Hovering on "product" will show up a dropdown menu', async () => {
        // get "display, visibility, opacity" styles of all elements inside the header element
        const styles = await page.evaluate(() => {
            const header = document.querySelector('header');
            const elements = Array.from(header.querySelectorAll('*'));
            return elements.map(elements => {
                const { display, visibility, opacity } = window.getComputedStyle(elements);
                return { display, visibility, opacity };
            });
        });
       
        // target a has content "product" and hover over it
        const productLink = await page.$x("//nav//a[contains(., 'Product')]");
        await productLink[0].hover();
        
        await page.screenshot({ path: 'example2.png' });
        // wait for the hover effect to be applied
        await page.waitForTimeout(1000);
        // get the styles again after hover
        const stylesHover = await page.evaluate(() => {
            const header = document.querySelector('header');
            const elements = Array.from(header.querySelectorAll('*'));
            return elements.map(elements => {
                const { display, visibility, opacity } = window.getComputedStyle(elements);
                return { display, visibility, opacity };
            });
        });
        // change the styles to string to compare them
        const stylesStr = styles.map(style => JSON.stringify(style).replace(/,/g, '')).join('');
        const stylesHoverStr = stylesHover.map(style => JSON.stringify(style).replace(/,/g, '')).join('')
        expect(stylesHoverStr).not.toBe(stylesStr);
    });
    test('The product boxes should have a border-radius', async () => {
        // get the border-radius of all elements inside the main element
        const borderRadius = await page.evaluate(() => {
            const main = document.querySelector('main');
            const elements = Array.from(main.querySelectorAll('*')).filter(el => {
                const { borderRadius } = window.getComputedStyle(el);
                return borderRadius !== '0px';
            });
            return elements.length;
        });
        expect(borderRadius).toBeGreaterThan(2);
    });
   
});