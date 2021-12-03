async function autoScroll(page) {
    await page.evaluate(async () => {
        console.log('page evaluate!')
        await new Promise((resolve, reject) => {
            let totalHeight = 0;
            let distance = 100;
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 10);
        });
    });
}

module.exports = {
    autoScroll
};