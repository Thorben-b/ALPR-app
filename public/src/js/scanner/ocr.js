async function loadOCR() {
    console.time('loading Tessarect');
    const { createWorker, createScheduler } = Tesseract;
    const scheduler = createScheduler();
    const worker = createWorker();
    await worker.load();
    await worker.loadLanguage('eng');
    await worker.initialize('eng');
    await worker.setParameters({
        tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    });
    scheduler.addWorker(worker);
    console.timeEnd('loading Tessarect');
    return scheduler;
}

function performOCR(canvas, scheduler) {
    let result = scheduler.addJob('recognize', canvas)
        .then(({ data: { text } }) => {
            return text;
        });
    return result;
}